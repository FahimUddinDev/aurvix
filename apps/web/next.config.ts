import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  images: {
    domains: ['localhost'],
    remotePatterns: [{ protocol: 'http', hostname: 'localhost', port: '9000' }],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', '@radix-ui/react-icons'],
  },
};

export default withNextIntl(nextConfig);
