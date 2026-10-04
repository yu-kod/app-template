import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test-utils/render";
import HomePage from "./HomePage";

describe("HomePage", () => {
  it("API が応答すれば稼働中と表示する", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: "ok" })));
    vi.stubGlobal("fetch", fetch);

    renderWithProviders(<HomePage />);

    expect(screen.getByText("API の状態を確認中…")).toBeInTheDocument();
    expect(await screen.findByText("API: 稼働中")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("/api/health", expect.anything());
  });

  it("API に届かなければその旨を表示する", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    renderWithProviders(<HomePage />);

    expect(await screen.findByRole("alert")).toHaveTextContent("API に接続できない");
  });
});
