/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Transpile workspace packages that ship TypeScript source.
  transpilePackages: ["@scs/types"],
};

export default nextConfig;
