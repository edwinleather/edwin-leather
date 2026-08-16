import "@fontsource-variable/manrope";
import "@fontsource-variable/fraunces";

// Self-hosted via @fontsource so the build never needs to fetch fonts from
// Google's CDN (avoids Vercel build-sandbox failures downloading woff2 files).
export const manrope = { variable: "--font-manrope" };
export const fraunces = { variable: "--font-fraunces" };