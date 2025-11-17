/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // 将 /api/* 和 /audios/* 请求代理到后端 API 服务器
  async rewrites() {
    // 从环境变量获取后端 API 地址，默认为 localhost:8000
    const apiUrl = process.env.API_BASE_URL || 'http://8.130.116.143:8809';
    
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
      // 代理音频文件和其他静态资源
      {
        source: '/audios/:path*',
        destination: `${apiUrl}/audios/:path*`,
      },
      {
        source: '/subtitles/:path*',
        destination: `${apiUrl}/subtitles/:path*`,
      },
      {
        source: '/profiles/:path*',
        destination: `${apiUrl}/profiles/:path*`,
      },
    ];
  },
}

export default nextConfig
