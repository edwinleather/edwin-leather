type CloudinaryImageLoaderProps = {
  src: string;
  width: number;
  quality?: number;
};

const MARKER = "/image/upload/";

export default function cloudinaryLoader({ src, width }: CloudinaryImageLoaderProps): string {
  if (!/^https:\/\/res\.cloudinary\.com\/z7o6zvqo\/image\/upload\//.test(src)) return src;

  const idx = src.indexOf(MARKER);
  const rest = src.slice(idx + MARKER.length);
  const transforms = `q_auto,f_auto,w_${width}`;

  return src.slice(0, idx + MARKER.length) + transforms + "/" + rest;
}