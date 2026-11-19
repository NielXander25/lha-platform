import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Timetable and credential uploads are up to 4 MB; leave room for form overhead.
    serverActions: { bodySizeLimit: "4.5mb" },
  },
};

export default nextConfig;
