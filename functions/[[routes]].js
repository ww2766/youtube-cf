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

      // 移除开头的斜杠进行匹配
      const path = url.pathname.replace(/^\//, '');
      console.log('[Routes] 处理路径:', path);

      // API路由处理
      if (path === 'api/analyze') {
        console.log('[Routes] 处理 api/analyze 请求');
        console.log('[Routes] 请求方法:', request.method);
        console.log('[Routes] 请求头:', Object.fromEntries(request.headers));
        
        const { onRequest } = await import('./api/analyze');
        const response = await onRequest({ request, env });
        
        // 确保返回正确的CORS头
        const headers = new Headers(response.headers);
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        headers.set('Access-Control-Allow-Headers', 'Content-Type');
        
        return new Response(response.body, {
          status: response.status,
          headers
        });
      }

      // 如果不是API请求，返回404
      return new Response(JSON.stringify({ error: 'Not Found' }), { 
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (error) {
      console.error('[Routes] Error:', error);
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
} 