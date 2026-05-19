/** @type {import('next').NextConfig} */
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

let apiHostname = 'localhost';
try {
  apiHostname = new URL(apiUrl).hostname;
} catch {
  /* keep default */
}

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: apiHostname },
      { protocol: 'https', hostname: apiHostname },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'localhost' },
    ],
  },
};

export default nextConfig;
