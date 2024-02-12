/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack(config) {
        config.externals.push({ vectordb: 'vectordb' })
        return config;
    }
};

export default nextConfig;
