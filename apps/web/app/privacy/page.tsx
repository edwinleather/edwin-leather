import type { Metadata } from "next";
import { PageRenderer } from "@/components/PageRenderer";
import { getPageContent, PAGE_METADATA } from "@/lib/pages";

export const metadata: Metadata = PAGE_METADATA.privacy;

export default async function PrivacyPage() {
  const content = await getPageContent("privacy");
  if (!content) return <div className="container" style={{ padding: "120px 0 80px" }}><p>This page is currently unavailable.</p></div>;
  return <PageRenderer content={content} page="privacy" />;
}