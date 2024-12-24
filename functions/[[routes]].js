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

      // 移除开头的斜杠进行匹配
      const path = url.pathname.replace(/^\//, '');
      console.log('[Routes] 处理路径:', path);

      // API路由处理
      if (path === 'api/analyze') {
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
          error: '未找到请求的资源'
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
          error: '服务器错误'
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
  },
}; 