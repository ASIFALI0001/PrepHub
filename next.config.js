/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  experimental: {
    // Keep prefetched/visited routes in the client-side Router Cache so
    // navigating back to a page is instant instead of re-fetching from the
    // server. `dynamic` covers the auth-gated dashboard pages (server-rendered
    // on demand); `static` covers landing/auth. Values are in seconds.
    staleTimes: {
      dynamic: 60,
      static: 300,
    },
  },
};

export default nextConfig;
