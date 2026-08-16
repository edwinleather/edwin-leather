import type { Metadata } from "next";
import { PageRenderer } from "@/components/PageRenderer";
import { getPageContent, PAGE_METADATA } from "@/lib/pages";

export const metadata: Metadata = PAGE_METADATA.about;

export default async function AboutPage() {
  const content = await getPageContent("about");
  if (!content) return null;
  return <PageRenderer content={content} page="about" />;
}