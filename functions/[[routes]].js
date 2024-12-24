import { handleCORS } from './middleware/cors';

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      
      // 详细的请求日志
      console.log('[Routes] 请求详情:', {
        完整URL: request.url,
        主机名: url.hostname,
        路径: url.pathname,
        方法: request.method,
        API密钥存在: !!env.YOUTUBE_API_KEY,
        请求头: Object.fromEntries(request.headers)
      });

      // 处理所有路由的 CORS
      const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      };

      // 处理 CORS 预检请求
      if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
      }

      // API 路由处理
      if (url.pathname === '/api/analyze') {
        console.log('[Routes] 处理分析请求');
        
        try {
          const { onRequest } = await import('./api/analyze');
          const response = await onRequest({ request, env });
          
          // 添加 CORS 头
          const headers = new Headers(response.headers);
          Object.entries(corsHeaders).forEach(([key, value]) => {
            headers.set(key, value);
          });

          return new Response(response.body, {
            status: response.status,
            headers
          });
        } catch (e) {
          console.error('[Routes] API处理错误:', e);
          return new Response(JSON.stringify({
            error: '处理请求时发生错误',
            details: e.message
          }), {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        }
      }

      // 404 响应
      console.log('[Routes] 未找到匹配的路由:', url.pathname);
      return new Response(JSON.stringify({
        error: '未找到请求的资源',
        path: url.pathname
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });

    } catch (error) {
      console.error('[Routes] 全局错误:', error);
      return new Response(JSON.stringify({
        error: '服务器错误',
        details: error.message
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
  }
} 