import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Timetable and credential uploads are up to 5 MB; leave room for form overhead.
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
