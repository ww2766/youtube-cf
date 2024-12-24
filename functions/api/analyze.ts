interface Env {
  YOUTUBE_API_KEY: string;
}

export async function onRequest(context: { request: Request; env: Env }) {
  try {
    console.log('[Analyze] 开始处理请求');
    
    // 验证 API 密钥
    if (!context.env.YOUTUBE_API_KEY) {
      throw new Error('YouTube API 密钥未配置');
    }

    // 解析请求体
    const body = await context.request.json();
    console.log('[Analyze] 请求体:', body);

    if (!body.url) {
      throw new Error('缺少视频 URL');
    }

    // 提取视频ID
    const videoId = extractVideoId(body.url);
    console.log('[Analyze] 提取的视频ID:', videoId);

    if (!videoId) {
      throw new Error('无效的 YouTube 视频链接');
    }

    // 调用 YouTube Data API v3
    const apiUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    apiUrl.searchParams.set('key', context.env.YOUTUBE_API_KEY);
    apiUrl.searchParams.set('id', videoId);
    apiUrl.searchParams.set('part', 'snippet,contentDetails,statistics');

    console.log('[Analyze] 调用 YouTube API:', apiUrl.toString());

    const response = await fetch(apiUrl);
    if (!response.ok) {
      const error = await response.json();
      console.error('[Analyze] YouTube API 错误:', error);
      throw new Error(error.error?.message || 'YouTube API 请求失败');
    }

    const data = await response.json();
    console.log('[Analyze] YouTube API 响应:', data);

    if (!data.items?.length) {
      throw new Error('视频不存在或无法访问');
    }

    const video = data.items[0];

    return new Response(
      JSON.stringify({
        success: true,
        videoInfo: {
          id: video.id,
          title: video.snippet.title,
          description: video.snippet.description,
          thumbnail: video.snippet.thumbnails.maxres?.url || 
                    video.snippet.thumbnails.high.url,
          duration: formatDuration(video.contentDetails.duration),
          author: video.snippet.channelTitle,
          publishedAt: video.snippet.publishedAt,
          statistics: {
            views: parseInt(video.statistics.viewCount),
            likes: parseInt(video.statistics.likeCount),
            comments: parseInt(video.statistics.commentCount)
          }
        }
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  } catch (error) {
    console.error('[Analyze] 错误:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : '处理请求时发生错误'
      }),
      {
        status: error instanceof Error && error.message.includes('API') ? 503 : 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}

function extractVideoId(url: string): string | null {
  try {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
      /youtube\.com\/shorts\/([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return null;
  } catch {
    return null;
  }
}

function formatDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return '未知';

  const hours = (match[1] || '').replace('H', '');
  const minutes = (match[2] || '').replace('M', '');
  const seconds = (match[3] || '').replace('S', '');

  let result = '';
  if (hours) result += `${hours}:`;
  if (minutes) result += `${minutes.padStart(2, '0')}:`;
  else result += '00:';
  if (seconds) result += seconds.padStart(2, '0');
  else result += '00';

  return result;
} 