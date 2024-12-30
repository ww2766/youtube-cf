import { NextRequest, NextResponse } from 'next/server';
import { isValidYouTubeUrl } from '@/app/utils/validation';
import { APIError, handleAPIError } from '@/app/utils/error';
//import { extractVideoId, formatDuration } from '@/app/utils/youtube';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  console.log('开始调测');
  try {
    if (!request.body) {
      throw new APIError('请求体不能为空', 400);
    }
    console.log('开始调测1');
    const { url } = await request.json().catch(() => {
      console.error('JSON解析失败');
      return {};
    });
    console.log('开始调测2');
    if (!url || typeof url !== 'string') {
      throw new APIError('请提供有效的视频URL', 400);
    }
    console.log(url);
    //if (!isValidYouTubeUrl(url)) {
    //  throw new APIError('无效的YouTube视频链接', 400);
    //}
    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    if (!pattern.test(url)) {
      throw new APIError('无效的YouTube视频链接', 400);
    }
    console.log('开始调测4');
    const apiKey = process.env.YOUTUBE_API_KEY;
    console.log('API Key status:', {
      exists: !!apiKey,
      length: apiKey?.length || 0
    });
    console.log('开始调测5');
    if (!apiKey) {
      throw new APIError('API密钥未配置', 500);
    }
    console.log('开始调测6');
    const videoId = extractVideoId(url);
    if (!videoId) {
      throw new APIError('无法提取视频ID', 400);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    console.log('开始调测6');
    try {
      const apiUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
      apiUrl.searchParams.set('key', apiKey);
      apiUrl.searchParams.set('id', videoId);
      apiUrl.searchParams.set('part', 'snippet,contentDetails,statistics');

      const response = await fetch(apiUrl.toString(), {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      });

      clearTimeout(timeout);
      console.log('开始调测7');
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new APIError(
          error.error?.message || `YouTube API请求失败: ${response.status}`, 
          response.status
        );
      }

      const data = await response.json();

      if (!data.items?.length) {
        throw new APIError('未找到视频', 404);
      }
      console.log('开始调测8');
      const video = data.items[0];

      return NextResponse.json({
        success: true,
        videoInfo: {
          id: video.id,
          title: video.snippet?.title || '未知标题',
          description: video.snippet?.description || '',
          thumbnail: video.snippet?.thumbnails?.maxres?.url || 
                    video.snippet?.thumbnails?.high?.url ||
                    video.snippet?.thumbnails?.default?.url ||
                    '',
          duration: video.contentDetails?.duration ? 
                   formatDuration(video.contentDetails.duration) : 
                   '未知',
          author: video.snippet?.channelTitle || '未知作者',
          publishedAt: video.snippet?.publishedAt || '',
          statistics: {
            views: parseInt(video.statistics?.viewCount || '0'),
            likes: parseInt(video.statistics?.likeCount || '0'),
            comments: parseInt(video.statistics?.commentCount || '0')
          },
          tags: video.snippet?.tags || [],
          category: video.snippet?.categoryId || '',
          privacyStatus: video.status?.privacyStatus || 'public',
          defaultLanguage: video.snippet?.defaultLanguage || 'unknown',
          defaultAudioLanguage: video.snippet?.defaultAudioLanguage || 'unknown'
        }
      }, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      });
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.log('开始调测9');
    console.error('API Error:', {
      name: err?.name || 'UnknownError',
      message: err?.message || 'Unknown error occurred',
      stack: err?.stack || 'No stack trace available'
    });
    console.log('开始调测10');
    if (error instanceof APIError) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, {
        status: error.status,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      });
    }
    console.log('开始调测11');
    return NextResponse.json({
      success: false,
      error: '服务器内部错误',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
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
