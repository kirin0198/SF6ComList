/**
 * コネクターアイコンコンポーネント
 * コンボの繋ぎを表すシンボル（>, xx, ~, ,）を表示する
 */

type ConnectorSymbol = ">" | "xx" | "~" | ",";

interface ConnectorIconProps {
  symbol: ConnectorSymbol;
  className?: string;
}

// コネクター記号の説明ラベル
const connectorLabels: Record<ConnectorSymbol, string> = {
  ">": "リンク",
  xx: "キャンセル",
  "~": "ディレイ/派生",
  ",": "コマンド区切り",
};

/**
 * ConnectorIcon コンポーネント
 * コンボの繋ぎ記号を黄色のモノスペースフォントで表示する
 */
export default function ConnectorIcon({
  symbol,
  className = "",
}: ConnectorIconProps) {
  return (
    <span
      className={[
        "inline-block font-mono font-bold text-yellow-300",
        className,
      ].join(" ")}
      aria-label={connectorLabels[symbol]}
      title={connectorLabels[symbol]}
    >
      {symbol}
    </span>
  );
}
