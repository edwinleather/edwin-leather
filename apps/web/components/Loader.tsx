import { siteConfig } from "@/lib/site-config";

export function Loader({ label = "Loading", size = "md" }: { label?: string; size?: "sm" | "md" | "lg" }) {
  return (
    <div className={`loader loader--${size}`} role="status" aria-live="polite">
      <span className="loader__blobs">
        <i className="loader__blob loader__blob--1" />
        <i className="loader__blob loader__blob--2" />
        <i className="loader__blob loader__blob--3" />
        <span className="loader__core"><img src={siteConfig.brandLogo} alt="" /></span>
      </span>
      {label && <span className="loader__label">{label}</span>}
    </div>
  );
}