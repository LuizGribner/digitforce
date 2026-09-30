"use client";

import { Component, type ReactNode } from "react";

type Props = { name: string; fallback: ReactNode; children: ReactNode };

/**
 * Isola uma seção animada: se ela quebrar (render ou efeitos, ex.: GSAP no useGSAP), mostra a versão estática da
 * seção em vez de derrubar a página inteira.
 */
export class SectionBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error(`Seção "${this.props.name}" caiu para a versão estática:`, error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
