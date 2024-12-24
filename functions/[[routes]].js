import { handleCORS } from './middleware/cors';

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);

      // 处理 CORS 预检请求
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        });
      }

      // API 路由处理
      if (url.pathname === '/api/analyze') {
        const { onRequest } = await import('./api/analyze');
        return onRequest({ request, env });
      }

      // 404 响应
      return new Response(
        JSON.stringify({ error: 'Not Found' }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
  },
}; 