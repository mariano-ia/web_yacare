/** @type {import('next').NextConfig} */
const nextConfig = {
  // ISR: allow on-demand revalidation via API
  // Pages use `revalidate` export for time-based fallback
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      // Add your CDN / image host here
    ],
  },
  basePath: '/blog',
};

export default nextConfig;
