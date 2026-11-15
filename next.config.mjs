/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Three.js / WebGL packages need to be transpiled for Next.js
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
  allowedDevOrigins: ["172.26.128.1", "localhost:3000"],
};

export default nextConfig;
