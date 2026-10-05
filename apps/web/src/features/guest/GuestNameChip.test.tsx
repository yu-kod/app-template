import type { GuestSession } from "@app/identity-client";
import { ApiRequestError } from "@app/web-core";
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { returningGuestSession } from "@/test-utils/guest";
import { renderWithProviders } from "@/test-utils/render";
import { GuestNameChip } from "./GuestNameChip";

function setup(overrides: Partial<GuestSession> = {}) {
  const session = { ...returningGuestSession(), ...overrides };
  return { session, ...renderWithProviders(<GuestNameChip />, { guestSession: session }) };
}

describe("GuestNameChip", () => {
  it("ゲストの名前を表示し、押すと変えられることが分かる", async () => {
    setup();

    expect(
      await screen.findByRole("button", { name: "名前を変える（今: ねむいペンギン）" })
    ).toHaveTextContent("ねむいペンギン");
  });

  it("まだゲストでなければ何も出さない（名前を入力させない）", async () => {
    const { container, session } = setup({ get: vi.fn().mockResolvedValue(null) });

    await vi.waitFor(() => expect(session.get).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("押すと今の名前が入った入力欄になり、確定すると名前が変わる", async () => {
    const { user, session } = setup();
    await user.click(await screen.findByRole("button", { name: /名前を変える/ }));

    const input = screen.getByRole("textbox", { name: "名前" });
    expect(input).toHaveValue("ねむいペンギン");
    expect(input).toHaveFocus();

    await user.clear(input);
    await user.type(input, "  Alice {Enter}");

    expect(session.rename).toHaveBeenCalledWith("Alice");
    expect(
      await screen.findByRole("button", { name: "名前を変える（今: Alice）" })
    ).toBeInTheDocument();
  });

  it("Escape で取り消すと元の名前に戻り、サーバーには送らない", async () => {
    const { user, session } = setup();
    await user.click(await screen.findByRole("button", { name: /名前を変える/ }));

    await user.type(screen.getByRole("textbox", { name: "名前" }), "xyz{Escape}");

    expect(screen.getByRole("button", { name: /今: ねむいペンギン/ })).toBeInTheDocument();
    expect(session.rename).not.toHaveBeenCalled();
  });

  it("取り消しボタンでも元に戻る", async () => {
    const { user } = setup();
    await user.click(await screen.findByRole("button", { name: /名前を変える/ }));

    await user.click(screen.getByRole("button", { name: "取り消す" }));

    expect(screen.getByRole("button", { name: /今: ねむいペンギン/ })).toBeInTheDocument();
  });

  it("名前を変えずに確定したらサーバーには送らない", async () => {
    const { user, session } = setup();
    await user.click(await screen.findByRole("button", { name: /名前を変える/ }));

    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(session.rename).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /今: ねむいペンギン/ })).toBeInTheDocument();
  });

  it("空にしたら保存できない", async () => {
    const { user } = setup();
    await user.click(await screen.findByRole("button", { name: /名前を変える/ }));

    await user.clear(screen.getByRole("textbox", { name: "名前" }));

    expect(screen.getByRole("button", { name: "保存" })).toBeDisabled();
  });

  it("20 文字より長くは打てない", async () => {
    const { user } = setup();
    await user.click(await screen.findByRole("button", { name: /名前を変える/ }));

    expect(screen.getByRole("textbox", { name: "名前" })).toHaveAttribute("maxLength", "20");
  });

  it("サーバーに断られたら理由を出し、入力欄のまま直せる", async () => {
    const { user } = setup({
      rename: vi
        .fn()
        .mockRejectedValue(
          new ApiRequestError(400, "VALIDATION_ERROR", "名前は20文字以内にしてください")
        ),
    });
    await user.click(await screen.findByRole("button", { name: /名前を変える/ }));

    await user.type(screen.getByRole("textbox", { name: "名前" }), "!{Enter}");

    expect(await screen.findByRole("alert")).toHaveTextContent("名前は20文字以内にしてください");
    expect(screen.getByRole("textbox", { name: "名前" })).toBeInTheDocument();
  });

  it("サーバーに届かなかったら、その旨を出す", async () => {
    const { user } = setup({ rename: vi.fn().mockRejectedValue(new TypeError("offline")) });
    await user.click(await screen.findByRole("button", { name: /名前を変える/ }));

    await user.type(screen.getByRole("textbox", { name: "名前" }), "!{Enter}");

    expect(await screen.findByRole("alert")).toHaveTextContent("名前を変えられなかった");
  });
});
