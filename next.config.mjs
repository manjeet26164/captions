/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
    serverComponentsExternalPackages: ['fluent-ffmpeg', 'ffmpeg-static'],
    // Without this, hosts like Vercel won't bundle fonts/ into the render route's
    // serverless function since nothing `import`s it — it's only read via fs at runtime.
    outputFileTracingIncludes: {
      '/api/render/route': ['./fonts/**']
    }
  }
};

export default nextConfig;
