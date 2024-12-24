interface Env {
  YOUTUBE_API_KEY: string;
}

export async function onRequest(context: { request: Request; env: Env }) {
  try {
    // 打印 API 密钥前几个字符（安全起见）
    console.log('[API] API密钥状态:', {
      存在: !!context.env.YOUTUBE_API_KEY,
      前缀: context.env.YOUTUBE_API_KEY ? context.env.YOUTUBE_API_KEY.substring(0, 5) + '...' : 'none'
    });

    // 验证 API 密钥
    if (!context.env.YOUTUBE_API_KEY) {
      throw new Error('API密钥未配置');
    }

    // 解析请求体
    const { url } = await context.request.json();
    if (!url) {
      throw new Error('请提供视频URL');
    }

    // 提取视频ID
    const videoId = extractVideoId(url);
    console.log('[API] 提取的视频ID:', videoId);

    if (!videoId) {
      throw new Error('无效的YouTube视频链接');
    }

    // 构建 YouTube API 请求
    const apiUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    apiUrl.searchParams.set('key', context.env.YOUTUBE_API_KEY);
    apiUrl.searchParams.set('id', videoId);
    apiUrl.searchParams.set('part', 'snippet,contentDetails,statistics');

    console.log('[API] 请求YouTube API:', apiUrl.toString().replace(context.env.YOUTUBE_API_KEY, 'HIDDEN_KEY'));

    // 发送请求
    const response = await fetch(apiUrl);
    const data = await response.json();

    // 记录响应状态
    console.log('[API] YouTube响应状态:', response.status);
    if (!response.ok) {
      console.error('[API] YouTube API错误:', data.error);
      throw new Error(data.error?.message || 'YouTube API请求失败');
    }

    // 检查响应数据
    if (!data.items?.length) {
      throw new Error('未找到视频');
    }

    const video = data.items[0];
    console.log('[API] 成功获取视频信息:', {
      id: video.id,
      title: video.snippet.title
    });

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
    console.error('[API] 错误:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}

function extractVideoId(url: string): string | null {
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