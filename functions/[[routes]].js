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
        API密钥存在: !!env.YOUTUBE_API_KEY
      });

      // API路由处理
      if (url.pathname.startsWith('/api/analyze')) {
        try {
          const { onRequest } = await import('./api/analyze');
          const response = await onRequest({ request, env });
          console.log('[Routes] API响应:', {
            状态: response.status,
            头部: Object.fromEntries(response.headers)
          });
          return handleCORS(response);
        } catch (error) {
          console.error('[Routes] API处理错误:', error);
          return new Response(
            JSON.stringify({
              success: false,
              error: error.message || '处理请求时发生错误'
            }),
            {
              status: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              }
            }
          );
        }
      }

      // 404 响应
      return new Response(
        JSON.stringify({
          success: false,
          error: '未找到请求的资源',
          path: url.pathname
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    } catch (error) {
      console.error('[Routes] 全局错误:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: '服务器错误',
          details: error.message
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }
  }
}; 