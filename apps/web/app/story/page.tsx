import type { Metadata } from "next";
import { PageRenderer } from "@/components/PageRenderer";
import { getPageContent, PAGE_METADATA } from "@/lib/pages";

export const metadata: Metadata = PAGE_METADATA.story;

export default async function StoryPage() {
  const content = await getPageContent("story");
  if (!content) return null;
  return <PageRenderer content={content} page="story" />;
}