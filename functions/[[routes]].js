import { handleCORS } from './middleware/cors';

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      console.log('[Routes] 请求详情:', {
        完整URL: request.url,
        主机名: url.hostname,
        路径: url.pathname,
        方法: request.method,
      });

      // 处理 API 请求
      if (url.pathname === '/api/analyze') {
        const { onRequest } = await import('./api/analyze');
        return onRequest({ request, env });
      }

      // 处理其他路径
      return new Response(
        JSON.stringify({ error: '未找到请求的资源' }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    } catch (error) {
      console.error('[Routes] 错误:', error);
      return new Response(
        JSON.stringify({ error: '服务器错误' }),
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