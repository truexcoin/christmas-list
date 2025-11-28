/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
};

// Setup Cloudflare Pages development platform
if (process.env.NODE_ENV === 'development') {
  try {
    const { setupDevPlatform } = require('@cloudflare/next-on-pages/next-dev');
    setupDevPlatform();
  } catch (e) {
    // Not in Cloudflare Pages dev environment
  }
}

export default nextConfig;
