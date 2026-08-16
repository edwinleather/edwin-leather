import { Router } from "express";
import { SiteSetting } from "../models/SiteSetting.js";
import { getPageContent, PAGE_KEYS } from "../services/pages.js";

export const siteRouter = Router();

siteRouter.get("/settings", async (_req, res, next) => {
  try {
    const doc = await SiteSetting.findOne({ key: "site" }).lean();
    const homepage = {
      marquee: { items: ["MADE TO AGE", "EDWIN LEATHERS", "SMALL BATCH", "FULL GRAIN"] },
      featured: { eyebrow: "Current selection", title: "Objects for the everyday.", linkLabel: "Shop all" },
      editorial: {
        image: "https://res.cloudinary.com/z7o6zvqo/image/upload/v1786894065/edwin/assets/hvt6qhohydohffwjtbm7.webp",
        eyebrow: "Material first",
        title: "The surface should remember you.",
        paragraph:
          "We choose leather for how it will look after years of use-not for how flawless it looks under studio lights on day one. Grain, small marks, and tonal variation are part of the material, not defects to hide.",
        features: ["Full-grain hides", "Repair-minded construction", "Small-batch finishing"],
        buttonLabel: "How we make it"
      },
      stats: {
        eyebrow: "By the numbers",
        title: "Slow is the point.",
        note: "Small batches, deliberate choices, and a workshop that measures quality in decades rather than drops.",
        items: [
          { value: 8, label: "Objects in the collection" },
          { value: 60, label: "Hours of craft per piece" },
          { value: 100, mark: "%", label: "Full-grain leather, always" },
          { value: 4, mark: " days", label: "To reach your door" }
        ]
      },
      categories: {
        eyebrow: "Shop by ritual",
        title: "Where will it go with you?",
        cards: [
          { title: "Bags", copy: "Carry a little better.", image: "https://res.cloudinary.com/z7o6zvqo/image/upload/v1786894146/edwin/assets/uiaqojlrt5zq2d8o8zmo.webp" },
          { title: "Wallets", copy: "Small, useful, personal.", image: "https://res.cloudinary.com/z7o6zvqo/image/upload/v1786894275/edwin/assets/jmsky5qf33pm7v9izsel.webp" },
          { title: "Belts", copy: "One piece. No shortcuts.", image: "https://res.cloudinary.com/z7o6zvqo/image/upload/v1786894758/edwin/assets/eqapt0yuxl1vs0sqw9j1.webp" }
        ]
      },
      newArrivals: { eyebrow: "Recently cut", title: "New to the bench.", note: "From the workshop" },
      closing: { eyebrow: "A slower object", line1: "Not designed for next season.", line2: "Designed for your next decade." }
    };
    const defaults = {
      announcement: "",
      heroBadge: "New season · The Everyday Edit",
      heroEyebrow: "Leather goods, made to gather stories",
      heroTitleLine1: "Objects for",
      heroTitleLine2: "your next decade.",
      heroImage:
        "https://res.cloudinary.com/z7o6zvqo/image/upload/v1786894110/edwin/assets/wjorleikcvlc21h4tjys.webp",
      heroSubtitle:
        "Full-grain leather. Considered proportions. Hardware that earns its patina. Objects for the everyday, without the disposable part.",
      estYear: 2026,
      homepage
    };
    return res.json({ ok: true, data: { ...defaults, ...doc, homepage: { ...homepage, ...(doc?.homepage ?? {}) } } });
  } catch (error) {
    return next(error);
  }
});

siteRouter.get("/pages/:key", async (req, res, next) => {
  try {
    const key = req.params.key;
    if (!PAGE_KEYS.includes(key as (typeof PAGE_KEYS)[number])) {
      return res.status(404).json({ ok: false, error: "Page not found" });
    }
    const data = await getPageContent(key);
    return res.json({ ok: true, data });
  } catch (error) {
    return next(error);
  }
});