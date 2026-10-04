import { render, type RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement, ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";

type Options = Omit<RenderOptions, "wrapper"> & {
  /** 表示を始める URL */
  route?: string;
};

/** ルーターなど、アプリ全体で必要な Provider で包んで描画する */
export function renderWithProviders(ui: ReactElement, { route = "/", ...options }: Options = {}) {
  function Providers({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>;
  }
  return { user: userEvent.setup(), ...render(ui, { wrapper: Providers, ...options }) };
}
