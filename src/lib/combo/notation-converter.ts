/**
 * SF6 テンキー表記 ⇔ ComboSequence 変換ロジック
 * poc/notation-converter.ts から移植。import パスを変更。
 */

import type {
  ComboStep,
  ComboSequence,
  NormalInput,
  ChargeInput,
  ConnectorStep,
  Direction,
  ButtonInput,
  AttackModifier,
} from "./types";

// ============================================================
// 既知のボタン入力セット（パースに使用）
// ============================================================

const BUTTON_NAMES = new Set<ButtonInput>([
  "LP",
  "MP",
  "HP",
  "LK",
  "MK",
  "HK",
  "DI",
  "DR",
  "DP",
  "PP",
  "DRev",
  "OD",
  "SA1",
  "SA2",
  "SA3",
  "Throw",
]);

const MODIFIER_PREFIXES: AttackModifier[] = ["j", "cl", "cr", "st"];

// ============================================================
// テンキー表記文字列 → ComboSequence パーサー
// ============================================================

/**
 * テンキー表記の1トークン（例: "5MP", "236HP", "2MK", "DR", "SA2"）を
 * NormalInput または ChargeInput にパースする。
 *
 * サポートする表記:
 *   - "5MP" → directions: ["5"], button: "MP"
 *   - "236HP" → directions: ["2","3","6"], button: "HP"
 *   - "[4]6HP" → charge input
 *   - "j.HP" → modifier: "j", directions: [], button: "HP"
 *   - "DR", "SA1", "DI" → directions: [], button: DriveAction/SuperArt
 *   - "OD236HP" → isOD: true, directions: ["2","3","6"], button: "HP"
 */
function parseInputToken(token: string): NormalInput | ChargeInput | null {
  // 溜め入力: [4]6HP
  const chargeMatch = token.match(/^\[(\d)\](\d)([A-Z]+)$/);
  if (chargeMatch) {
    const [, chargeDir, releaseDir, btnStr] = chargeMatch;
    if (!isValidButton(btnStr) || !isBasicButton(btnStr)) return null;
    return {
      type: "charge",
      chargeDir: chargeDir as Direction,
      releaseDir: releaseDir as Direction,
      button: btnStr,
    };
  }

  // 修飾子プレフィックス: j.HP, cl.HP, cr.MK, st.HP
  let modifier: AttackModifier | undefined;
  let rest = token;
  for (const pfx of MODIFIER_PREFIXES) {
    if (token.startsWith(pfx + ".")) {
      modifier = pfx;
      rest = token.slice(pfx.length + 1);
      break;
    }
  }

  // OD プレフィックス: OD236HP
  let isOD = false;
  if (rest.startsWith("OD") && rest.length > 2 && /\d/.test(rest[2])) {
    isOD = true;
    rest = rest.slice(2);
  }

  // ボタンのみ（方向なし）: DR, SA1, DI, Throw など
  if (isValidButton(rest)) {
    return {
      type: "normal",
      directions: [],
      button: rest as ButtonInput,
      modifier,
      isOD,
    };
  }

  // 方向数字 + ボタン: 236HP, 5MP, 2MK
  const motionMatch = rest.match(/^(\d+)([A-Za-z]+)$/);
  if (motionMatch) {
    const [, dirs, btnStr] = motionMatch;
    const directions = dirs.split("") as Direction[];
    const button = btnStr.toUpperCase();
    if (!isValidButton(button)) return null;
    return {
      type: "normal",
      directions,
      button: button as ButtonInput,
      modifier,
      isOD,
    };
  }

  return null;
}

function isValidButton(s: string): boolean {
  return BUTTON_NAMES.has(s as ButtonInput);
}

function isBasicButton(
  s: string,
): s is "LP" | "MP" | "HP" | "LK" | "MK" | "HK" {
  return ["LP", "MP", "HP", "LK", "MK", "HK"].includes(s);
}

/**
 * テンキー表記文字列をトークン列に分割する。
 *
 * 区切り文字: " > ", " xx ", " ~ ", ", "
 * 複数のセパレーターが存在する場合、文字列内で最も前に位置するものを優先して分割する。
 */
function tokenizeNotation(notation: string): string[] {
  const separators = [" > ", " xx ", " ~ ", ", "];
  const tokens: string[] = [];

  let remaining = notation.trim();

  while (remaining.length > 0) {
    // 全セパレーターのうち、最も小さいインデックスに位置するものを選ぶ
    let earliestIdx = -1;
    let earliestSep = "";

    for (const sep of separators) {
      const idx = remaining.indexOf(sep);
      if (idx === -1) continue;
      if (earliestIdx === -1 || idx < earliestIdx) {
        earliestIdx = idx;
        earliestSep = sep;
      }
    }

    if (earliestIdx === -1) {
      // セパレーターが見つからない: 残りをすべてトークンとして追加
      tokens.push(remaining);
      break;
    }

    if (earliestIdx === 0) {
      // 先頭がセパレーター
      const symbol = earliestSep.trim() as ConnectorStep["symbol"];
      tokens.push(`__SEP:${symbol}`);
      remaining = remaining.slice(earliestSep.length);
    } else {
      // セパレーター前のトークンを切り出す
      tokens.push(remaining.slice(0, earliestIdx));
      remaining = remaining.slice(earliestIdx);
    }
  }

  return tokens.filter((t) => t.length > 0);
}

/**
 * テンキー表記文字列 → ComboSequence
 *
 * @param notation - "5MP > 2MK xx 214MK > SA2" 形式の文字列
 * @returns パース結果の ComboSequence
 */
export function parseNotation(notation: string): ComboSequence {
  const tokens = tokenizeNotation(notation);
  const steps: ComboStep[] = [];

  for (const token of tokens) {
    if (token.startsWith("__SEP:")) {
      const symbol = token.slice(6) as ConnectorStep["symbol"];
      steps.push({ type: "connector", symbol });
      continue;
    }

    const input = parseInputToken(token);
    if (input) {
      steps.push(input);
    } else {
      // パース不能なトークンは notation として文字列のまま保持する
      // 実装上はエラーとして記録し、UIで警告表示する
      console.warn(`[notation-converter] パース不能トークン: "${token}"`);
    }
  }

  return { notation, steps };
}

// ============================================================
// ComboSequence → テンキー表記文字列 シリアライザー
// ============================================================

/**
 * NormalInput をテンキー表記文字列に変換する。
 * 例: { directions: ["2","3","6"], button: "HP" } → "236HP"
 */
function serializeNormalInput(step: NormalInput): string {
  let result = "";

  if (step.isOD) result += "OD";
  if (step.modifier) result += `${step.modifier}.`;

  result += step.directions.join("");
  result += step.button;

  return result;
}

/**
 * ChargeInput をテンキー表記文字列に変換する。
 * 例: { chargeDir: "4", releaseDir: "6", button: "HP" } → "[4]6HP"
 */
function serializeChargeInput(step: ChargeInput): string {
  return `[${step.chargeDir}]${step.releaseDir}${step.button}`;
}

/**
 * ConnectorStep をテンキー表記文字列に変換する（前後にスペースを含む）。
 */
function serializeConnector(step: ConnectorStep): string {
  return ` ${step.symbol} `;
}

/**
 * ComboSequence → テンキー表記文字列
 */
export function serializeNotation(sequence: ComboSequence): string {
  let result = "";

  for (const step of sequence.steps) {
    switch (step.type) {
      case "normal":
        result += serializeNormalInput(step);
        break;
      case "charge":
        result += serializeChargeInput(step);
        break;
      case "connector":
        result += serializeConnector(step);
        break;
    }
  }

  return result.trim();
}
