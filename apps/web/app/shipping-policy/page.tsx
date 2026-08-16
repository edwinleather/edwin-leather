import type { Metadata } from "next";
import { PageRenderer } from "@/components/PageRenderer";
import { getPageContent, PAGE_METADATA } from "@/lib/pages";

export const metadata: Metadata = PAGE_METADATA.shipping;

export default async function ShippingPolicyPage() {
  const content = await getPageContent("shipping");
  if (!content) return null;
  return <PageRenderer content={content} page="shipping" />;
}