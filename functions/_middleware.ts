interface Env {
  YOUTUBE_API_KEY: string;
}

interface MiddlewareArgs {
  request: Request;
  next: () => Promise<Response>;
  env: Env;
}

export async function onRequest({ request, next, env }: MiddlewareArgs) {
  console.log('[Middleware] 请求路径:', new URL(request.url).pathname);
  
  // 处理 CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    // 继续处理请求
    const response = await next();
    
    // 添加 CORS 头
    const newHeaders = new Headers(response.headers);
    newHeaders.set('Access-Control-Allow-Origin', '*');
    
    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    });
  } catch (error) {
    console.error('[Middleware] 错误:', error);
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
} 