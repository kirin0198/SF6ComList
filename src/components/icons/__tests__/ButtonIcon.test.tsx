/**
 * ButtonIcon コンポーネントのテスト
 * 各ボタンのアイコンがレンダリングされることを確認する
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ButtonIcon from "../ButtonIcon";

// ButtonIcon でサポートされるボタン種別
const ALL_BUTTONS = [
  "LP",
  "MP",
  "HP",
  "LK",
  "MK",
  "HK",
  "DI",
  "DR",
  "DP",
  "OD",
  "DRev",
  "SA1",
  "SA2",
  "SA3",
  "Throw",
] as const;

type ButtonType = (typeof ALL_BUTTONS)[number];

describe("ButtonIcon", () => {
  it("全ボタン種別でレンダリングされる", () => {
    ALL_BUTTONS.forEach((btn) => {
      const { container } = render(<ButtonIcon button={btn} />);
      expect(
        container.firstChild,
        `${btn}: レンダリングされること`,
      ).toBeTruthy();
    });
  });

  it("LP ボタンが 'LP' ラベルで表示される", () => {
    render(<ButtonIcon button="LP" />);
    expect(screen.getByText("LP")).toBeTruthy();
  });

  it("SA1 ボタンが 'SA1' ラベルで表示される", () => {
    render(<ButtonIcon button="SA1" />);
    expect(screen.getByText("SA1")).toBeTruthy();
  });

  it("Throw ボタンが '投' ラベルで表示される", () => {
    render(<ButtonIcon button="Throw" />);
    expect(screen.getByText("投")).toBeTruthy();
  });

  it("DRev ボタンが 'DR!' ラベルで表示される", () => {
    render(<ButtonIcon button="DRev" />);
    expect(screen.getByText("DR!")).toBeTruthy();
  });

  it("aria-label にボタン名が設定される", () => {
    ALL_BUTTONS.forEach((btn) => {
      const { container } = render(<ButtonIcon button={btn} />);
      const span = container.querySelector("[aria-label]");
      expect(span, `${btn}: aria-label が存在すること`).toBeTruthy();
      expect(
        span?.getAttribute("aria-label"),
        `${btn}: aria-label がボタン名であること`,
      ).toBe(btn);
    });
  });

  it("デフォルトサイズ（sm）でレンダリングされる", () => {
    const { container } = render(<ButtonIcon button="LP" />);
    const span = container.querySelector("span");
    // sm サイズの CSS クラスが含まれる
    expect(span?.className).toContain("h-6");
  });

  it("size='md' でレンダリングされる", () => {
    const { container } = render(<ButtonIcon button="LP" size="md" />);
    const span = container.querySelector("span");
    expect(span?.className).toContain("h-8");
  });

  it("size='lg' でレンダリングされる", () => {
    const { container } = render(<ButtonIcon button="LP" size="lg" />);
    const span = container.querySelector("span");
    expect(span?.className).toContain("h-10");
  });

  it("パンチ系ボタン（LP/MP/HP）が青系の背景色クラスを持つ", () => {
    const punchButtons: ButtonType[] = ["LP", "MP", "HP"];
    punchButtons.forEach((btn) => {
      const { container } = render(<ButtonIcon button={btn} />);
      const span = container.querySelector("span");
      expect(span?.className, `${btn}: 青系の背景色クラスを持つこと`).toMatch(
        /bg-blue-/,
      );
    });
  });

  it("キック系ボタン（LK/MK/HK）が赤系の背景色クラスを持つ", () => {
    const kickButtons: ButtonType[] = ["LK", "MK", "HK"];
    kickButtons.forEach((btn) => {
      const { container } = render(<ButtonIcon button={btn} />);
      const span = container.querySelector("span");
      expect(span?.className, `${btn}: 赤系の背景色クラスを持つこと`).toMatch(
        /bg-red-/,
      );
    });
  });

  it("カスタム className が適用される", () => {
    const { container } = render(
      <ButtonIcon button="LP" className="my-custom-class" />,
    );
    const span = container.querySelector("span");
    expect(span?.className).toContain("my-custom-class");
  });
});
