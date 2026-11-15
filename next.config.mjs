/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  output: "standalone",

  transpilePackages: [
    "three",
    "@react-three/fiber",
    "@react-three/drei",
  ],

  allowedDevOrigins: ["172.26.128.1", "localhost:3000"],
};

export default nextConfig;