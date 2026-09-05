export type ProductVariant = {
  id: string;
  label: string;
  sku: string;
  color: string;
  size?: string;
  inventory: number;
  allowBackorder?: boolean;
  price?: number;
  salePrice?: number;
  promotionPrice?: number;
};

// A dimension a product varies along (e.g. Color) and the options it offers.
export type VariantAttributeDef = {
  attributeId: string;
  name: string;
  options: string[];
};

// A concrete combination (e.g. Black / UK 8) from the ProductVariant collection.
export type ProductVariantItem = {
  id: string;
  sku: string;
  price: number;
  salePrice?: number;
  promotionPrice?: number;
  stock: number;
  active: boolean;
  allowBackorder?: boolean;
  attributes: { key: string; name: string; value: string | string[] }[];
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  category: string;
  collection: string;
  brand?: string;
  hsn?: string;
  gst?: number;
  deliveryBy?: string;
  articleNumber: string[];
  styleCode?: string;
  brandColor?: string;
  brandSize?: string;
  ukIndiaSize?: string;
  euroSize?: string;
  womenSandalType?: string;
  color: string[];
  typeForFlats?: string;
  typeForHeels?: string;
  occasion: string[];
  outerMaterial: string[];
  heelHeight?: string;
  idealFor?: string;
  ornamentationType?: string;
  insoleMaterial: string[];
  packOf?: string;
  closure: string[];
  heelPattern?: string;
  soleMaterial: string[];
  innerMaterial: string[];
  upperPattern?: string;
  careInstructions: string[];
  removableInsole?: string;
  searchKeywords: string[];
  keyFeatures: string[];
  videoUrl?: string;
  eanUpc: string[];
  cushioningLevel?: string;
  otherDetails?: string;
  includedInBox: string[];
  returnReplacement?: string;
  cashDelivery?: string;
  customerSupport?: string;
  price: number;
  compareAtPrice?: number;
  salePrice?: number;
  promotion?: { name: string; amount: number; price: number } | null;
  seoTitle?: string;
  seoDescription?: string;
  badge?: string;
  description: string;
  details: string[];
  images: string[];
  imageAlts: string[];
  attributes?: { key: string; label: string; value: string | string[] }[];
  variants: ProductVariant[];
  variantAttributes?: VariantAttributeDef[];
  productVariants?: ProductVariantItem[];
  featured?: boolean;
  newArrival?: boolean;
};

export type CartItem = {
  lineId: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  priceSnapshot?: number;
  variantId: string;
  variantLabel: string;
  variantSnapshot?: string;
  quantity: number;
  isOutOfStock?: boolean;
  maxQuantity?: number;
  codAvailable?: boolean;
};
