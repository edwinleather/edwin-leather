"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const BLUR_PLACEHOLDER =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAj0lEQVR4nLXDjQaDYAAF0PtwmSTZmiRJknxaW7XW/syYycxMZmave3uKezj4n3oq43foqIxv31IZn66mMsZ2TWW86xWV8aoMlfEsCyrjYXIqYygyKuOep1TGLUuojGsaUxmXJKIyznFIZRyjgMrYh0sqYxcsqIyt71EZzdylMjaeQ2VUrk1llM6MyjC2ReUJVpcBrGph3sMAAAAASUVORK5CYII=";

type SmartImageProps = {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  style?: React.CSSProperties;
  quality?: number;
  crossfade?: boolean;
};

export function SmartImage({
  src,
  alt,
  className = "",
  priority = false,
  sizes,
  style,
  quality = 82,
  crossfade = true
}: SmartImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const fadeClass = crossfade ? (loaded ? " img-smooth img-loaded" : " img-smooth") : "";
  const showLoader = !loaded && !errored;

  useEffect(() => {
    if (crossfade && imgRef.current?.complete) setLoaded(true);
  }, [crossfade]);

  return (
    <span className={`img-shell ${errored ? "is-error" : ""}`}>
      <Image
        ref={imgRef}
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        quality={quality}
        decoding="async"
        placeholder="blur"
        blurDataURL={BLUR_PLACEHOLDER}
        onLoad={() => setLoaded(true)}
        onError={() => { setLoaded(false); setErrored(true); }}
        className={`${className}${fadeClass}`.trim()}
        style={style}
      />
      {showLoader && (
        <span className="img-shell__loader" aria-hidden="true">
          <i />
        </span>
      )}
      {errored && (
        <span className="img-shell__fallback" role="img" aria-label={alt}>
          {alt.slice(0, 1).toUpperCase()}
        </span>
      )}
    </span>
  );
}