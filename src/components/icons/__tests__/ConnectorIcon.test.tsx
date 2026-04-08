/**
 * ConnectorIcon コンポーネントのテスト
 * 各コネクターシンボルがレンダリングされることを確認する
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ConnectorIcon from "../ConnectorIcon";

describe("ConnectorIcon", () => {
  // TC-CI01: ">" シンボルがレンダリングされる
  it("TC-CI01: '>' シンボルがレンダリングされる", () => {
    render(<ConnectorIcon symbol=">" />);
    expect(screen.getByText(">")).toBeTruthy();
    const el = screen.getByText(">");
    expect(el.getAttribute("aria-label")).toBe("リンク");
  });

  // TC-CI02: "xx" シンボルがレンダリングされる
  it("TC-CI02: 'xx' シンボルがレンダリングされる", () => {
    render(<ConnectorIcon symbol="xx" />);
    expect(screen.getByText("xx")).toBeTruthy();
    const el = screen.getByText("xx");
    expect(el.getAttribute("aria-label")).toBe("キャンセル");
  });

  // TC-CI03: "~" シンボルがレンダリングされる
  it("TC-CI03: '~' シンボルがレンダリングされる", () => {
    render(<ConnectorIcon symbol="~" />);
    expect(screen.getByText("~")).toBeTruthy();
    const el = screen.getByText("~");
    expect(el.getAttribute("aria-label")).toBe("ディレイ/派生");
  });

  // TC-CI04: "," シンボルがレンダリングされる
  it("TC-CI04: ',' シンボルがレンダリングされる", () => {
    render(<ConnectorIcon symbol="," />);
    expect(screen.getByText(",")).toBeTruthy();
    const el = screen.getByText(",");
    expect(el.getAttribute("aria-label")).toBe("コマンド区切り");
  });

  // TC-CI05: カスタム className が適用される
  it("TC-CI05: カスタム className が適用される", () => {
    const { container } = render(<ConnectorIcon symbol=">" className="test" />);
    const span = container.querySelector("span");
    expect(span?.className).toContain("test");
  });

  // TC-CI06: title 属性にラベルが設定される
  it("TC-CI06: title 属性にラベルが設定される（xx → キャンセル）", () => {
    render(<ConnectorIcon symbol="xx" />);
    const el = screen.getByText("xx");
    expect(el.getAttribute("title")).toBe("キャンセル");
  });
});
