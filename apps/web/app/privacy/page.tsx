import type { Metadata } from "next";
import { PageRenderer } from "@/components/PageRenderer";
import { getPageContent, PAGE_METADATA } from "@/lib/pages";

export const metadata: Metadata = PAGE_METADATA.privacy;

export default async function PrivacyPage() {
  const content = await getPageContent("privacy");
  if (!content) return null;
  return <PageRenderer content={content} page="privacy" />;
}