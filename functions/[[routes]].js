import { handleCORS } from './middleware/cors';

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      console.log('[Routes] Request URL:', url.pathname);
      console.log('[Routes] Environment check:', {
        hasYouTubeApiKey: !!env.YOUTUBE_API_KEY,
        method: request.method,
        headers: Object.fromEntries(request.headers)
      });

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
        console.log('[Routes] 处理 /api/analyze 请求');
        console.log('[Routes] 请求方法:', request.method);
        console.log('[Routes] 请求头:', Object.fromEntries(request.headers));
        
        const { onRequest } = await import('./api/analyze');
        return onRequest({ request, env });
      }

      // 如果不是API请求，返回404
      return new Response('Not Found', { 
        status: 404,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (error) {
      console.error('[Routes] Error:', error);
      return new Response('Internal Server Error', { 
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
} 