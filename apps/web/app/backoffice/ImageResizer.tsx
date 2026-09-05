"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, RotateCcw, X } from "lucide-react";

type Props = {
  src: string;
  targetW: number;
  targetH: number;
  onCancel: () => void;
  onConfirm: (dataUri: string) => void;
  compact?: boolean;
};

export function ImageResizer({ src, targetW, targetH, onCancel, onConfirm, compact }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const [ready, setReady] = useState(false);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const s = Math.max(targetW / img.naturalWidth, targetH / img.naturalHeight);
      setScale(s);
      setReady(true);
    };
    img.src = src;
  }, [src, targetW, targetH]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !ready) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dw = img.naturalWidth * scale * zoom;
    const dh = img.naturalHeight * scale * zoom;
    const maxX = Math.max(0, (dw - targetW) / 2);
    const maxY = Math.max(0, (dh - targetH) / 2);
    const ox = Math.min(maxX, Math.max(-maxX, off.x));
    const oy = Math.min(maxY, Math.max(-maxY, off.y));
    ctx.clearRect(0, 0, targetW, targetH);
    ctx.fillStyle = "#e3dacf";
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.save();
    ctx.translate(ox + (targetW - dw) / 2, oy + (targetH - dh) / 2);
    ctx.drawImage(img, 0, 0, dw, dh);
    ctx.restore();
  }, [ready, scale, zoom, off, targetW, targetH]);

  useEffect(() => { draw(); }, [draw]);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragRef.current = { x: e.clientX, y: e.clientY, ox: off.x, oy: off.y };
    (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return;
    setOff({ x: dragRef.current.ox + (e.clientX - dragRef.current.x), y: dragRef.current.oy + (e.clientY - dragRef.current.y) });
  };
  const onPointerUp = () => { dragRef.current = null; };
  const onWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    setZoom((z) => Math.min(4, Math.max(1, z + (e.deltaY < 0 ? 0.1 : -0.1))));
  };

  if (compact) {
    return (
      <div className="img-crop-inline">
        <canvas
          ref={canvasRef}
          width={targetW}
          height={targetH}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onWheel={onWheel}
          className="img-crop-inline__canvas"
        />
        {!ready && <div className="img-crop-inline__loading">Loading…</div>}
        <div className="img-crop-inline__bar">
          <input type="range" min="1" max="4" step="0.05" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
          <span className="img-crop-inline__pct">{Math.round(zoom * 100)}%</span>
          <button type="button" className="icon-button" onClick={() => { setZoom(1); setOff({ x: 0, y: 0 }); }} aria-label="Reset"><RotateCcw size={12} /></button>
          <button type="button" className="icon-button" onClick={onCancel} aria-label="Cancel"><X size={12} /></button>
          <button type="button" className="icon-button img-crop-inline__confirm" onClick={() => { if (canvasRef.current?.toDataURL("image/jpeg", 0.92).length) onConfirm(canvasRef.current!.toDataURL("image/jpeg", 0.92)); }} aria-label="Confirm"><Maximize2 size={12} /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="resizer-overlay">
      <div className="resizer">
        <div className="resizer__head">
          <div><span className="eyebrow">Resize</span><h3>Fit your image</h3></div>
          <button type="button" className="icon-button" onClick={onCancel} aria-label="Close"><X size={15} /></button>
        </div>
        <p className="resizer__hint">Recommended {targetW} × {targetH} px (4:5). Drag to position, scroll or use the slider to zoom, then confirm.</p>
        <div className="resizer__canvas">
          <canvas
            ref={canvasRef}
            width={targetW}
            height={targetH}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onWheel={onWheel}
            style={{ touchAction: "none", cursor: "grab" }}
          />
          {!ready && <div className="resizer__loading">Loading image…</div>}
          <span className="resizer__zoom-label">{Math.round(zoom * 100)}%</span>
        </div>
        <div className="resizer__controls">
          <input type="range" min="1" max="4" step="0.05" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} aria-label="Zoom" />
          <div className="resizer__controls-row">
            <button type="button" className="button button--ghost" onClick={() => { setZoom(1); setOff({ x: 0, y: 0 }); }}><RotateCcw size={13} /> Reset</button>
            <span className="resizer__dims">{targetW} × {targetH}</span>
            <button type="button" className="button button--dark" disabled={!ready} onClick={() => canvasRef.current?.toDataURL("image/jpeg", 0.92).length && onConfirm(canvasRef.current!.toDataURL("image/jpeg", 0.92))}>
              <Maximize2 size={14} /> Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
