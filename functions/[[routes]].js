import { handleCORS } from './middleware/cors';

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      
      // 处理CORS预检请求
      if (request.method === "OPTIONS") {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
      }

      // API路由处理
      if (url.pathname === '/api/analyze') {
        const { onRequest } = await import('./api/analyze');
        const response = await onRequest({ request, env });
        return handleCORS(response);
      }

      return handleCORS(new Response('Not Found', { status: 404 }));
    } catch (error) {
      console.error('Route error:', error);
      return handleCORS(new Response('Internal Server Error', { status: 500 }));
    }
  }
} 