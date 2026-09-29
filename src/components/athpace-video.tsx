"use client";

import { useRef, useState } from "react";
import { Play } from "lucide-react";

const V = "/assets/video";

/**
 * Player do vídeo do Athpace. preload="none": só o poster carrega; o vídeo começa a baixar no clique do play.
 * Depois do clique toca com som e com os controles nativos.
 */
export function AthpaceVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);

  function play() {
    setStarted(true);
    void videoRef.current?.play();
  }

  return (
    <div className="glass rounded-[28px] p-2 md:p-3">
      <div className="relative aspect-video overflow-hidden rounded-[20px] bg-[var(--df-navy-deep)]">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          poster={`${V}/athpace-poster.webp`}
          preload="none"
          playsInline
          controls={started}
          aria-label="Vídeo de apresentação do Athpace"
        >
          {/* A primeira source cujo media bate é a usada: 720p no mobile, 1080p no resto */}
          <source src={`${V}/athpace-720.mp4`} type="video/mp4" media="(max-width: 767px)" />
          <source src={`${V}/athpace-1080.mp4`} type="video/mp4" />
        </video>

        {!started && (
          <button
            type="button"
            onClick={play}
            aria-label="Reproduzir o vídeo do Athpace"
            className="group absolute inset-0 flex items-center justify-center bg-[radial-gradient(closest-side,rgba(0,0,36,0.35),transparent)]"
          >
            <span className="glass-strong flex h-20 w-20 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-105 md:h-24 md:w-24">
              <Play className="ml-1 h-8 w-8 fill-white text-white md:h-9 md:w-9" />
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
