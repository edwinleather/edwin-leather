export type ProductVariant = {
  id: string;
  label: string;
  sku: string;
  color: string;
  size?: string;
  inventory: number;
  allowBackorder?: boolean;
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
  price: number;
  compareAtPrice?: number;
  badge?: string;
  description: string;
  details: string[];
  images: string[];
  imageAlts: string[];
  variants: ProductVariant[];
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
  variantId: string;
  variantLabel: string;
  quantity: number;
  isOutOfStock?: boolean;
  codAvailable?: boolean;
};
