import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // HTTP 431対策: Supabaseセッションのクッキーが大きくなることがあるため、
  // HTTPヘッダーサイズの上限を引き上げる
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
};

export default nextConfig;
