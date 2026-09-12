type CloudinaryImageLoaderProps = {
  src: string;
  width: number;
  quality?: number;
};

const MARKER = "/image/upload/";

export default function cloudinaryLoader({ src, width }: CloudinaryImageLoaderProps): string {
  if (!/^https:\/\/res\.cloudinary\.com\/gpldwiup\/image\/upload\//.test(src)) return src;

  const idx = src.indexOf(MARKER);
  const rest = src.slice(idx + MARKER.length);
  const cappedWidth = Math.min(width, 1280);
  const transforms = `q_auto,f_auto,w_${cappedWidth}`;

  return src.slice(0, idx + MARKER.length) + transforms + "/" + rest;
}