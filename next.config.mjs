/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
    serverComponentsExternalPackages: ['fluent-ffmpeg', 'ffmpeg-static']
  }
};

export default nextConfig;
