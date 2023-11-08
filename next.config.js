/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "www.imgur.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "i.imgur.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "imgur.com",
        pathname: "**",
      },
    ],
  },
};

module.exports = nextConfig;
