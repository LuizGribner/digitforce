"use client";

import { Component, type ReactNode } from "react";

/** Se o canvas 3D falhar (contexto WebGL negado, driver), avisa a página para mostrar os fallbacks. */
export class CanvasBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Cena 3D indisponível:", error);
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
