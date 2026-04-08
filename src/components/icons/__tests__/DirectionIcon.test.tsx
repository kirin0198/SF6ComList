/**
 * DirectionIcon コンポーネントのテスト
 * 各方向のアイコンがレンダリングされることを確認する
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import DirectionIcon from "../DirectionIcon";

describe("DirectionIcon", () => {
  it("デフォルトサイズ（sm）でレンダリングされる", () => {
    const { container } = render(<DirectionIcon direction="6" />);
    expect(container.firstChild).toBeTruthy();
  });

  it("ニュートラル方向（5）は円形アイコンをレンダリングする", () => {
    const { container } = render(<DirectionIcon direction="5" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    // ニュートラルは circle 要素を含む
    const circle = container.querySelector("circle");
    expect(circle).toBeTruthy();
  });

  it("方向1〜4, 6〜9 は矢印アイコンをレンダリングする", () => {
    const arrowDirections = ["1", "2", "3", "4", "6", "7", "8", "9"] as const;
    arrowDirections.forEach((dir) => {
      const { container } = render(<DirectionIcon direction={dir} />);
      const svg = container.querySelector("svg");
      expect(svg, `方向${dir}: SVG が存在すること`).toBeTruthy();
      // 矢印は path 要素を含む
      const path = container.querySelector("path");
      expect(path, `方向${dir}: path が存在すること`).toBeTruthy();
    });
  });

  it("全方向（1-9）でレンダリングが成功する", () => {
    const allDirections = [
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
    ] as const;
    allDirections.forEach((dir) => {
      const { container } = render(<DirectionIcon direction={dir} />);
      const svg = container.querySelector("svg");
      expect(svg, `方向${dir}: SVG が存在すること`).toBeTruthy();
    });
  });

  it("数値型の方向でもレンダリングされる", () => {
    const { container } = render(<DirectionIcon direction={6} />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("size='md' でレンダリングされる", () => {
    const { container } = render(<DirectionIcon direction="6" size="md" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute("width")).toBe("32");
    expect(svg?.getAttribute("height")).toBe("32");
  });

  it("size='lg' でレンダリングされる", () => {
    const { container } = render(<DirectionIcon direction="6" size="lg" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute("width")).toBe("40");
    expect(svg?.getAttribute("height")).toBe("40");
  });

  it("size='sm' で 24x24px の SVG がレンダリングされる", () => {
    const { container } = render(<DirectionIcon direction="6" size="sm" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("24");
    expect(svg?.getAttribute("height")).toBe("24");
  });

  it("カスタム className が適用される", () => {
    const { container } = render(
      <DirectionIcon direction="6" className="test-class" />,
    );
    const svg = container.querySelector("svg");
    // SVG の className は SVGAnimatedString なので baseVal を確認する
    expect(svg?.className.baseVal).toContain("test-class");
  });
});
