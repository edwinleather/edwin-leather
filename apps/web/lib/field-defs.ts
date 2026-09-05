export type FieldType = "text" | "multi" | "textarea" | "select" | "yesno" | "number";
export type FieldSection = "specifications" | "listing";

// A reusable attribute in the shared pool. Categories attach these by reference.
export type Attribute = {
  _id: string;
  name: string;
  key: string;
  type: FieldType;
  options: string[];
  description?: string;
};

// A category's reference to a pooled attribute, including per-category behaviour.
export type CategoryAttributeRef = {
  attributeId: string | Attribute;
  required: boolean;
  customerVisible: boolean;
  sellerVisible: boolean;
  filterable: boolean;
  searchable: boolean;
  variant: boolean;
  displaySection: FieldSection;
  displayOrder: number;
};

export const ATTRIBUTE_TYPE_LABELS: { value: FieldType; label: string }[] = [
  { value: "text", label: "Short text" },
  { value: "multi", label: "Multiple values (Enter/comma)" },
  { value: "textarea", label: "Long text" },
  { value: "select", label: "Dropdown" },
  { value: "yesno", label: "Yes / No" },
  { value: "number", label: "Number" }
];

export type CategoryField = {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  required: boolean;
  section: FieldSection;
  group?: string;
};

export const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "text", label: "Short text" },
  { value: "multi", label: "Multiple values (Enter/comma)" },
  { value: "textarea", label: "Long text" },
  { value: "select", label: "Dropdown" },
  { value: "yesno", label: "Yes / No" },
  { value: "number", label: "Number" }
];

export const FIELD_SECTIONS: { value: FieldSection; label: string }[] = [
  { value: "specifications", label: "Specifications" },
  { value: "listing", label: "Listing details" }
];

export const PRODUCT_FIELDS: CategoryField[] = [
  { key: "articleNumber", label: "Article Number", type: "multi", required: false, section: "specifications", group: "Codes" },
  { key: "styleCode", label: "Style Code", type: "text", required: false, section: "specifications", group: "Codes" },
  { key: "packOf", label: "Pack of", type: "text", required: false, section: "specifications", group: "Pack" },
  { key: "brandSize", label: "Brand Size", type: "text", required: false, section: "specifications", group: "Sizing" },
  { key: "ukIndiaSize", label: "UK/India Size", type: "text", required: false, section: "specifications", group: "Sizing" },
  { key: "euroSize", label: "Euro Size", type: "text", required: false, section: "specifications", group: "Sizing" },
  { key: "brandColor", label: "Brand Colour", type: "text", required: false, section: "specifications", group: "Colour & pattern" },
  { key: "color", label: "Colour", type: "multi", required: false, section: "specifications", group: "Colour & pattern" },
  { key: "upperPattern", label: "Upper Pattern", type: "text", required: false, section: "specifications", group: "Colour & pattern" },
  { key: "heelPattern", label: "Heel Pattern", type: "text", required: false, section: "specifications", group: "Colour & pattern" },
  { key: "outerMaterial", label: "Outer Material", type: "multi", required: false, section: "specifications", group: "Material" },
  { key: "insoleMaterial", label: "Insole Material", type: "multi", required: false, section: "specifications", group: "Material" },
  { key: "soleMaterial", label: "Sole Material", type: "multi", required: false, section: "specifications", group: "Material" },
  { key: "innerMaterial", label: "Inner Material", type: "multi", required: false, section: "specifications", group: "Material" },
  { key: "womenSandalType", label: "Women Sandal Type", type: "text", required: false, section: "specifications", group: "Style & type" },
  { key: "typeForFlats", label: "Type for Flats", type: "text", required: false, section: "specifications", group: "Style & type" },
  { key: "typeForHeels", label: "Type for Heels", type: "text", required: false, section: "specifications", group: "Style & type" },
  { key: "heelHeight", label: "Heel Height", type: "text", required: false, section: "specifications", group: "Style & type" },
  { key: "ornamentationType", label: "Ornamentation Type", type: "text", required: false, section: "specifications", group: "Style & type" },
  { key: "occasion", label: "Occasion", type: "multi", required: false, section: "specifications", group: "Style & type" },
  { key: "closure", label: "Closure", type: "multi", required: false, section: "specifications", group: "Style & type" },
  { key: "removableInsole", label: "Removable Insole", type: "yesno", required: false, section: "specifications", group: "Fit & care" },
  { key: "cushioningLevel", label: "Cushioning Level", type: "select", options: ["Low", "Medium", "High", "Extra high"], required: false, section: "specifications", group: "Fit & care" },
  { key: "idealFor", label: "Ideal For", type: "text", required: false, section: "specifications", group: "Fit & care" },
  { key: "careInstructions", label: "Care Instructions", type: "multi", required: false, section: "specifications", group: "Fit & care" },
  { key: "searchKeywords", label: "Search Keywords", type: "multi", required: false, section: "listing", group: "Search" },
  { key: "keyFeatures", label: "Key Features", type: "multi", required: false, section: "listing", group: "Search" },
  { key: "videoUrl", label: "Video URL", type: "text", required: false, section: "listing", group: "Media" },
  { key: "eanUpc", label: "EAN/UPC", type: "multi", required: false, section: "listing", group: "Numbers" },
  { key: "includedInBox", label: "Included in Box", type: "multi", required: false, section: "listing", group: "Services" },
  { key: "returnReplacement", label: "Return / Replacement", type: "text", required: false, section: "listing", group: "Services" },
  { key: "cashDelivery", label: "No Cost Cash Delivery", type: "text", required: false, section: "listing", group: "Services" },
  { key: "customerSupport", label: "Customer Support", type: "text", required: false, section: "listing", group: "Services" },
  { key: "otherDetails", label: "Other Details", type: "textarea", required: false, section: "listing", group: "Other" }
];

export const KNOWN_FIELD_KEYS = new Set(PRODUCT_FIELDS.map((f) => f.key));

export function knownField(key: string): CategoryField | undefined {
  return PRODUCT_FIELDS.find((f) => f.key === key);
}