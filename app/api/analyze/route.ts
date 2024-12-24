import { NextRequest, NextResponse } from 'next/server';
import { isValidYouTubeUrl } from '@/app/utils/validation';
import { APIError, handleAPIError } from '@/app/utils/error';
import { extractVideoId, formatDuration } from '@/app/utils/youtube';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url || !isValidYouTubeUrl(url)) {
      throw new APIError('无效的YouTube视频链接', 400);
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new APIError('API密钥未配置', 500);
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      throw new APIError('无法提取视频ID', 400);
    }

    const apiUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    apiUrl.searchParams.set('key', apiKey);
    apiUrl.searchParams.set('id', videoId);
    apiUrl.searchParams.set('part', 'snippet,contentDetails,statistics');

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!response.ok) {
      throw new APIError(data.error?.message || 'YouTube API请求失败', response.status);
    }

    if (!data.items?.length) {
      throw new APIError('未找到视频', 404);
    }

    const video = data.items[0];
    return NextResponse.json({
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
    });
  } catch (error) {
    return handleAPIError(error);
  }
} 