/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'zfnwtnqwokwvuxxwxgsr.supabase.co',
      },
    ],
  },
}

module.exports = nextConfig

