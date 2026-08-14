import { SmoothLink } from "@/components/SmoothLink";

export default function NotFound() {
  return <div className="not-found container"><span className="eyebrow">404</span><h1>This piece wandered off.</h1><p>The page you’re looking for is not in this collection.</p><SmoothLink href="/shop" className="button button--dark">Return to shop</SmoothLink></div>;
}
