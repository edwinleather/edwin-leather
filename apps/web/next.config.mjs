/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com"
      }
    ],
    qualities: [75, 82, 88],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]
  },
  poweredByHeader: false,
  serverExternalPackages: ["mongoose", "jsonwebtoken", "nodemailer", "razorpay", "cookie-parser", "cors", "helmet", "express-rate-limit"]
};

export default nextConfig;
