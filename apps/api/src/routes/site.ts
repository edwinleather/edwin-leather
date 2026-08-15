import { Router } from "express";
import { SiteSetting } from "../models/SiteSetting.js";

export const siteRouter = Router();

siteRouter.get("/settings", async (_req, res, next) => {
  try {
    const doc = await SiteSetting.findOne({ key: "site" }).lean();
    const homepage = {
      marquee: { items: ["MADE TO AGE", "EDWIN LEATHERS", "SMALL BATCH", "FULL GRAIN"] },
      featured: { eyebrow: "Current selection", title: "Objects for the everyday.", linkLabel: "Shop all" },
      editorial: {
        image: "https://images.unsplash.com/photo-1523779917675-b6ed3a42a561?auto=format&fit=crop&w=1600&q=82",
        eyebrow: "Material first",
        title: "The surface should remember you.",
        paragraph:
          "We choose leather for how it will look after years of use—not for how flawless it looks under studio lights on day one. Grain, small marks, and tonal variation are part of the material, not defects to hide.",
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
          { title: "Bags", copy: "Carry a little better.", image: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=1100&q=88" },
          { title: "Wallets", copy: "Small, useful, personal.", image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1100&q=88" },
          { title: "Belts", copy: "One piece. No shortcuts.", image: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=1100&q=88" }
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
        "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1920&q=80",
      heroSubtitle:
        "Full-grain leather. Considered proportions. Hardware that earns its patina. Objects for the everyday, without the disposable part.",
      homepage
    };
    return res.json({ ok: true, data: { ...defaults, ...doc, homepage: { ...homepage, ...(doc?.homepage ?? {}) } } });
  } catch (error) {
    return next(error);
  }
});