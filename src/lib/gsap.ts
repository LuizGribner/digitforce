"use client";

import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

// Registro único dos plugins; todo código GSAP do site importa daqui
gsap.registerPlugin(useGSAP, ScrollTrigger, DrawSVGPlugin, CustomEase, SplitText);

// Celular: a barra de endereço aparece/some ao rolar e muda a altura da janela. Sem isso o ScrollTrigger faz um
// refresh a cada vez, o que dá saltos nas seções fixadas (as alturas usam svh, que não muda com a barra).
ScrollTrigger.config({ ignoreMobileResize: true });

// Curvas da sequência do rasgo
// Papel cedendo: arranca rápido depois de uma pequena resistência e assenta devagar
CustomEase.create("dfTear", "M0,0 C0.38,0 0.16,1 1,1");
// Linha correndo pela folha: aceleração curta, trajeto quase constante, freada suave no fim
CustomEase.create("dfDraw", "M0,0 C0.26,0 0.3,0.62 0.62,0.84 0.8,0.96 0.9,1 1,1");
// Entradas do que é revelado (out longo, sem overshoot)
CustomEase.create("dfSoft", "M0,0 C0.22,1 0.36,1 1,1");

export { gsap, CustomEase, DrawSVGPlugin, ScrollTrigger, SplitText, useGSAP };
