"use client";

/**
 * コネクターセレクターコンポーネント
 * コンボステップ間のコネクター（> xx ~ ,）を選択する
 */

import ConnectorIcon from "@/components/icons/ConnectorIcon";
import type { ConnectorStep } from "@/lib/combo/types";

type ConnectorSymbol = ConnectorStep["symbol"];

interface ConnectorSelectorProps {
  /** コネクターが選択されたときのコールバック */
  onSelect: (symbol: ConnectorSymbol) => void;
  className?: string;
}

/** コネクターの定義 */
interface ConnectorDef {
  symbol: ConnectorSymbol;
  description: string;
}

const CONNECTORS: ConnectorDef[] = [
  { symbol: ">", description: "リンク" },
  { symbol: "xx", description: "キャンセル" },
  { symbol: "~", description: "ディレイ/派生" },
  { symbol: ",", description: "コマンド区切り" },
];

/**
 * コネクターセレクターコンポーネント
 * UI_SPEC.md: bg-gray-800 text-yellow-300 border border-yellow-700 font-mono
 */
export default function ConnectorSelector({
  onSelect,
  className = "",
}: ConnectorSelectorProps) {
  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      role="group"
      aria-label="コネクター選択"
    >
      <span className="shrink-0 text-xs text-gray-400">接続:</span>

      <div className="flex gap-1.5">
        {CONNECTORS.map((connector) => (
          <button
            key={connector.symbol}
            type="button"
            onClick={() => onSelect(connector.symbol)}
            aria-label={connector.description}
            title={connector.description}
            className="flex h-8 min-w-10 items-center justify-center rounded border border-yellow-700 bg-gray-800 px-3 font-mono transition-colors duration-150 hover:border-yellow-500 hover:bg-gray-700 focus:ring-1 focus:ring-yellow-500 focus:outline-none active:bg-gray-600"
          >
            <ConnectorIcon symbol={connector.symbol} className="text-sm" />
          </button>
        ))}
      </div>
    </div>
  );
}
