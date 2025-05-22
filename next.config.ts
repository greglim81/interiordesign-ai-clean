// next.config.ts
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'firebasestorage.googleapis.com',
      'storage.googleapis.com',
      'replicate.delivery'
    ],
  },
};

module.exports = nextConfig;