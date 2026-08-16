import { Loader } from "@/components/Loader";

export default function Loading() {
  return (
    <div className="page-shell">
      <div className="container">
        <Loader label="Loading" />
      </div>
    </div>
  );
}