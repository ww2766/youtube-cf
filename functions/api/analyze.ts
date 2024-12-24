interface Env {
  YOUTUBE_API_KEY: string;
}

export async function onRequest(context: { request: Request; env: Env }) {
  try {
    console.log('API Key configured:', !!context.env.YOUTUBE_API_KEY);
    
    if (!context.env.YOUTUBE_API_KEY) {
      console.error('YouTube API key is not configured');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'API configuration error. Please contact administrator.'
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

    const { url } = await context.request.json();
    console.log('Received URL:', url);

    const videoId = extractVideoId(url);
    console.log('Extracted video ID:', videoId);

    if (!videoId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid YouTube URL. Please check the URL and try again.'
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

    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${context.env.YOUTUBE_API_KEY}&part=snippet,contentDetails`;
    console.log('Calling YouTube API...');

    const response = await fetch(apiUrl);
    const data = await response.json();
    console.log('YouTube API Response:', data);

    if (!response.ok) {
      console.error('YouTube API Error:', data);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to fetch video information from YouTube'
        }),
        {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    if (!data.items || data.items.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Video not found or is not accessible'
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    const video = data.items[0];
    const formats = [
      {
        formatId: 'mp4_720p',
        quality: '720p',
        extension: 'mp4',
        filesize: 0,
        downloadUrl: `https://www.youtube.com/watch?v=${videoId}`
      }
    ];

    return new Response(
      JSON.stringify({
        success: true,
        formats,
        videoInfo: {
          title: video.snippet.title,
          thumbnail: video.snippet.thumbnails.high.url,
          duration: video.contentDetails.duration,
          author: video.snippet.channelTitle
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
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'An unexpected error occurred. Please try again later.'
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

console.log('环境变量:', {
  YOUTUBE_API_KEY: !!context.env.YOUTUBE_API_KEY,
  url: context.request.url,
  method: context.request.method
}); 