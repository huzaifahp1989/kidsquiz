/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    // Pin the workspace root to this project to silence multi-lockfile warnings
    root: __dirname,
  },
}

module.exports = nextConfig
