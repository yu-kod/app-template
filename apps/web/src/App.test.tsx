import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import App from "./App";
import { renderWithProviders } from "./test-utils/render";

describe("App", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: "ok" })))
    );
  });

  it("/ でトップページを表示する", async () => {
    renderWithProviders(<App />, { route: "/" });

    expect(await screen.findByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("存在しない URL では「ページが見つからない」を表示し、トップへ戻れる", async () => {
    const { user } = renderWithProviders(<App />, { route: "/no-such-page" });

    expect(screen.getByRole("heading", { name: "ページが見つからない" })).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "トップへ戻る" }));

    expect(await screen.findByRole("heading", { level: 1 })).not.toHaveTextContent(
      "ページが見つからない"
    );
  });
});
