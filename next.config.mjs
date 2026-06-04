/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["ffmpeg-static", "ffprobe-static"],
    outputFileTracingIncludes: {
      "/api/generate": [
        "./node_modules/ffmpeg-static/ffmpeg",
        "./node_modules/ffprobe-static/bin/**/*",
      ],
      "/api/thumbnail": ["./node_modules/ffmpeg-static/ffmpeg"],
    },
  },
};

export default nextConfig;
