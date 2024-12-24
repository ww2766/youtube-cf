interface Env {
  YOUTUBE_API_KEY: string;
}

interface YouTubeVideoResponse {
  items: Array<{
    id: string;
    snippet: {
      title: string;
      description: string;
      thumbnails: {
        default: { url: string; width: number; height: number };
        medium: { url: string; width: number; height: number };
        high: { url: string; width: number; height: number };
        standard?: { url: string; width: number; height: number };
        maxres?: { url: string; width: number; height: number };
      };
      channelTitle: string;
      publishedAt: string;
    };
    contentDetails: {
      duration: string;
      dimension: string;
      definition: string;
      caption: string;
      licensedContent: boolean;
      projection: string;
    };
    statistics?: {
      viewCount: string;
      likeCount: string;
      favoriteCount: string;
      commentCount: string;
    };
  }>;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

export async function onRequest(context: { request: Request; env: Env }) {
  try {
    console.log('[Analyze] 开始处理请求');
    
    // 验证请求方法
    if (context.request.method !== 'POST') {
      throw new Error('仅支持 POST 请求');
    }

    // 验证 API 密钥
    if (!context.env.YOUTUBE_API_KEY) {
      throw new Error('YouTube API 密钥未配置');
    }

    // 解析请求体
    const { url } = await context.request.json();
    if (!url) {
      throw new Error('缺少视频 URL');
    }

    // 提取视频ID
    const videoId = extractVideoId(url);
    if (!videoId) {
      throw new Error('无效的 YouTube 视频链接');
    }

    console.log('[Analyze] 处理视频ID:', videoId);

    // 调用 YouTube Data API
    const apiUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    apiUrl.searchParams.append('key', context.env.YOUTUBE_API_KEY);
    apiUrl.searchParams.append('id', videoId);
    apiUrl.searchParams.append('part', 'snippet,contentDetails,statistics');

    console.log('[Analyze] 调用 YouTube API:', apiUrl.toString());
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      const error = await response.json();
      console.error('[Analyze] YouTube API 错误:', error);
      throw new Error(error.error?.message || 'YouTube API 请求失败');
    }

    const data = await response.json() as YouTubeVideoResponse;
    console.log('[Analyze] YouTube API 响应:', data);

    if (!data.items?.length) {
      throw new Error('视频不存在或无法访问');
    }

    const video = data.items[0];
    const formats = [
      {
        formatId: 'best',
        quality: 'HD',
        extension: 'mp4',
        filesize: 0,
        url: `https://www.youtube.com/watch?v=${videoId}`,
      }
    ];

    // 格式化视频时长
    const duration = formatDuration(video.contentDetails.duration);

    return new Response(
      JSON.stringify({
        success: true,
        formats,
        videoInfo: {
          id: video.id,
          title: video.snippet.title,
          description: video.snippet.description,
          thumbnail: video.snippet.thumbnails.maxres?.url || 
                    video.snippet.thumbnails.high.url,
          duration,
          author: video.snippet.channelTitle,
          publishedAt: video.snippet.publishedAt,
          statistics: video.statistics && {
            views: parseInt(video.statistics.viewCount),
            likes: parseInt(video.statistics.likeCount),
            comments: parseInt(video.statistics.commentCount),
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
  } catch (error) {
    console.error('Error extracting video ID:', error);
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