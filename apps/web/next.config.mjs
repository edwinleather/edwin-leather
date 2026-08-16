/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com"
      }
    ],
    qualities: [75, 82, 88]
  },
  poweredByHeader: false
};

export default nextConfig;
