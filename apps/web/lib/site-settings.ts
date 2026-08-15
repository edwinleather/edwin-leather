"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1";

export type StatItem = { value: number; mark?: string; label: string };
export type CategoryCard = { title: string; copy: string; image: string };
export type HomepageSettings = {
  marquee: { items: string[] };
  featured: { eyebrow: string; title: string; linkLabel: string };
  editorial: { image: string; eyebrow: string; title: string; paragraph: string; features: string[]; buttonLabel: string };
  stats: { eyebrow: string; title: string; note: string; items: StatItem[] };
  categories: { eyebrow: string; title: string; cards: CategoryCard[] };
  newArrivals: { eyebrow: string; title: string; note: string };
  closing: { eyebrow: string; line1: string; line2: string };
};

export type SiteSettings = {
  announcement: string;
  heroBadge: string;
  heroEyebrow: string;
  heroTitleLine1: string;
  heroTitleLine2: string;
  heroSubtitle: string;
  heroImage: string;
  homepage: HomepageSettings;
};

let cached: SiteSettings | null = null;
let inflight: Promise<SiteSettings | null> | null = null;

export async function loadSiteSettings(): Promise<SiteSettings | null> {
  if (cached) return cached;
  if (!inflight) {
    inflight = fetch(`${API}/site/settings`, { credentials: "include" })
      .then((r) => r.json())
      .then((body) => {
        cached = body?.data ?? null;
        return cached;
      })
      .catch(() => null)
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function useSiteSettings(): { loaded: boolean; settings: SiteSettings | null } {
  const [loaded, setLoaded] = useState(!!cached);
  const [settings, setSettings] = useState<SiteSettings | null>(cached);
  useEffect(() => {
    let active = true;
    loadSiteSettings().then((value) => {
      if (!active) return;
      setLoaded(true);
      setSettings(value);
    });
    return () => {
      active = false;
    };
  }, []);
  return { loaded, settings };
}