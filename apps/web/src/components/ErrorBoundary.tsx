import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type Props = { children: ReactNode };
type State = { failed: boolean };

/** 描画でエラーが出ても画面全体を消さず、読み込み直すボタンを出す */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="mx-auto grid max-w-md gap-3 px-4 py-10 text-center">
        <p>表示中に問題が起きた。読み込み直してほしい。</p>
        <Button className="h-11 justify-self-center" onClick={() => window.location.reload()}>
          読み込み直す
        </Button>
      </div>
    );
  }
}
