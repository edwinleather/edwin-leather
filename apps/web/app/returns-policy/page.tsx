import type { Metadata } from "next";
import { PageRenderer } from "@/components/PageRenderer";
import { getPageContent, PAGE_METADATA } from "@/lib/pages";

export const metadata: Metadata = PAGE_METADATA.returns;

export default async function ReturnsPolicyPage() {
  const content = await getPageContent("returns");
  if (!content) return null;
  return <PageRenderer content={content} page="returns" />;
}