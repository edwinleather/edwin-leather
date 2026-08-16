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
          image: { type: String, default: "https://images.unsplash.com/photo-1523779917675-b6ed3a42a561?auto=format&fit=crop&w=1600&q=82" },
          eyebrow: { type: String, default: "Material first" },
          title: { type: String, default: "The surface should remember you." },
          paragraph: {
            type: String,
            default: "We choose leather for how it will look after years of use—not for how flawless it looks under studio lights on day one. Grain, small marks, and tonal variation are part of the material, not defects to hide."
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
              { title: "Bags", copy: "Carry a little better.", image: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=1100&q=88" },
              { title: "Wallets", copy: "Small, useful, personal.", image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1100&q=88" },
              { title: "Belts", copy: "One piece. No shortcuts.", image: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=1100&q=88" }
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
    homepage: { type: homepageSchema, default: () => ({}) },
    invoice: { type: invoiceSchema, default: () => ({}) }
  },
  { timestamps: true }
);

export const SiteSetting = models.SiteSetting || model("SiteSetting", siteSettingSchema);