import type { Metadata } from "next";
import { PageRenderer } from "@/components/PageRenderer";
import { getPageContent, PAGE_METADATA } from "@/lib/pages";

export const metadata: Metadata = PAGE_METADATA.terms;

export default async function TermsPage() {
  const content = await getPageContent("terms");
  if (!content) return null;
  return <PageRenderer content={content} page="terms" />;
}