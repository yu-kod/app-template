import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "./ErrorBoundary";

function Broken(): never {
  throw new Error("boom");
}

describe("ErrorBoundary", () => {
  it("描画でエラーが出ても画面全体を消さず、読み込み直すボタンを出す", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>
    );
    expect(screen.getByRole("alert")).toHaveTextContent("表示中に問題が起きた");
    const reload = vi.fn();
    const original = window.location;
    Object.defineProperty(window, "location", { configurable: true, value: { reload } });
    screen.getByRole("button", { name: "読み込み直す" }).click();
    Object.defineProperty(window, "location", { configurable: true, value: original });
    expect(reload).toHaveBeenCalled();
  });

  it("問題がなければ中身をそのまま出す", () => {
    render(
      <ErrorBoundary>
        <p>中身</p>
      </ErrorBoundary>
    );
    expect(screen.getByText("中身")).toBeInTheDocument();
  });
});
