/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // App Hosting serves SSR via a Node server; no static export.
  poweredByHeader: false,
};

export default nextConfig;
