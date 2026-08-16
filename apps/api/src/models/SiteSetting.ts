import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const statItemSchema = new Schema({ value: Number, mark: String, label: String }, { _id: false });
const categoryCardSchema = new Schema({ title: String, copy: String, image: String }, { _id: false });

const invoiceSchema = new Schema(
  {
    companyName: { type: String, default: "Edwin Leathers" },
    gstin: { type: String, default: "" },
    cin: { type: String, default: "" },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    postalCode: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    website: { type: String, default: "" },
    invoicePrefix: { type: String, default: "INV-" },
    orderPrefix: { type: String, default: "LEA" },
    note: { type: String, default: "This is a computer-generated tax invoice and does not require a physical signature." }
  },
  { _id: false }
);

const homepageSchema = new Schema(
  {
    marquee: {
      type: new Schema({ items: { type: [String], default: ["MADE TO AGE", "EDWIN LEATHERS", "SMALL BATCH", "FULL GRAIN"] } }, { _id: false }),
      default: () => ({})
    },
    featured: {
      type: new Schema(
        { eyebrow: { type: String, default: "Current selection" }, title: { type: String, default: "Objects for the everyday." }, linkLabel: { type: String, default: "Shop all" } },
        { _id: false }
      ),
      default: () => ({})
    },
    editorial: {
      type: new Schema(
        {
          image: { type: String, default: "https://res.cloudinary.com/z7o6zvqo/image/upload/v1786894065/edwin/assets/hvt6qhohydohffwjtbm7.webp" },
          eyebrow: { type: String, default: "Material first" },
          title: { type: String, default: "The surface should remember you." },
          paragraph: {
            type: String,
            default: "We choose leather for how it will look after years of use-not for how flawless it looks under studio lights on day one. Grain, small marks, and tonal variation are part of the material, not defects to hide."
          },
          features: { type: [String], default: ["Full-grain hides", "Repair-minded construction", "Small-batch finishing"] },
          buttonLabel: { type: String, default: "How we make it" }
        },
        { _id: false }
      ),
      default: () => ({})
    },
    stats: {
      type: new Schema(
        {
          eyebrow: { type: String, default: "By the numbers" },
          title: { type: String, default: "Slow is the point." },
          note: { type: String, default: "Small batches, deliberate choices, and a workshop that measures quality in decades rather than drops." },
          items: {
            type: [statItemSchema],
            default: [
              { value: 8, label: "Objects in the collection" },
              { value: 60, label: "Hours of craft per piece" },
              { value: 100, mark: "%", label: "Full-grain leather, always" },
              { value: 4, mark: " days", label: "To reach your door" }
            ]
          }
        },
        { _id: false }
      ),
      default: () => ({})
    },
    categories: {
      type: new Schema(
        {
          eyebrow: { type: String, default: "Shop by ritual" },
          title: { type: String, default: "Where will it go with you?" },
          cards: {
            type: [categoryCardSchema],
            default: [
              { title: "Bags", copy: "Carry a little better.", image: "https://res.cloudinary.com/z7o6zvqo/image/upload/v1786894146/edwin/assets/uiaqojlrt5zq2d8o8zmo.webp" },
              { title: "Wallets", copy: "Small, useful, personal.", image: "https://res.cloudinary.com/z7o6zvqo/image/upload/v1786894275/edwin/assets/jmsky5qf33pm7v9izsel.webp" },
              { title: "Belts", copy: "One piece. No shortcuts.", image: "https://res.cloudinary.com/z7o6zvqo/image/upload/v1786894758/edwin/assets/eqapt0yuxl1vs0sqw9j1.webp" }
            ]
          }
        },
        { _id: false }
      ),
      default: () => ({})
    },
    newArrivals: {
      type: new Schema(
        { eyebrow: { type: String, default: "Recently cut" }, title: { type: String, default: "New to the bench." }, note: { type: String, default: "From the workshop" } },
        { _id: false }
      ),
      default: () => ({})
    },
    closing: {
      type: new Schema(
        { eyebrow: { type: String, default: "A slower object" }, line1: { type: String, default: "Not designed for next season." }, line2: { type: String, default: "Designed for your next decade." } },
        { _id: false }
      ),
      default: () => ({})
    }
  },
  { _id: false }
);

const siteSettingSchema = new Schema(
  {
    key: { type: String, default: "site", unique: true, index: true },
    announcement: { type: String, default: "" },
    heroBadge: { type: String, default: "New season · The Everyday Edit" },
    heroEyebrow: { type: String, default: "Leather goods, made to gather stories" },
    heroTitleLine1: { type: String, default: "Objects for" },
    heroTitleLine2: { type: String, default: "your next decade." },
    heroImage: { type: String, default: "" },
    heroSubtitle: {
      type: String,
      default: "Full-grain leather. Considered proportions. Hardware that earns its patina. Objects for the everyday, without the disposable part."
    },
    estYear: { type: Number, default: 2026 },
    homepage: { type: homepageSchema, default: () => ({}) },
    invoice: { type: invoiceSchema, default: () => ({}) }
  },
  { timestamps: true }
);

export const SiteSetting = models.SiteSetting || model("SiteSetting", siteSettingSchema);