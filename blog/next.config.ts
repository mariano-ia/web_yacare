/** @type {import('next').NextConfig} */
const nextConfig = {
  // ISR: allow on-demand revalidation via API
  // Pages use `revalidate` export for time-based fallback
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "image.pollinations.ai" },
      { protocol: "https", hostname: "ajqjicwuqbxpgkrrnryn.supabase.co" },
      // Add your CDN / image host here
    ],
  },
  basePath: '/blog',
  async redirects() {
    return [
      {
        source: '/',
        destination: '/es',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
