import { NextRequest, NextResponse } from 'next/server';
import { isValidYouTubeUrl } from '@/app/utils/validation';
import { APIError, handleAPIError } from '@/app/utils/error';
import { extractVideoId, formatDuration } from '@/app/utils/youtube';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    if (!request.body) {
      throw new APIError('请求体不能为空', 400);
    }

    const { url } = await request.json().catch(() => {
      console.error('JSON解析失败');
      return {};
    });
    
    if (!url || typeof url !== 'string') {
      throw new APIError('请提供有效的视频URL', 400);
    }

    if (!isValidYouTubeUrl(url)) {
      throw new APIError('无效的YouTube视频链接', 400);
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    console.log('API Key status:', {
      exists: !!apiKey,
      length: apiKey?.length || 0
    });
    
    if (!apiKey) {
      throw new APIError('API密钥未配置', 500);
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      throw new APIError('无法提取视频ID', 400);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

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
  } catch (error) {
    console.error('API Error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

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

    return NextResponse.json({
      success: false,
      error: '服务器内部错误',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  }
} 