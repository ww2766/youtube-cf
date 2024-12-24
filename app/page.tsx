'use client';

import { useState } from 'react';
import { FaYoutube, FaSpinner, FaInfoCircle } from 'react-icons/fa';

interface VideoInfo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  author: string;
  publishedAt: string;
  statistics: {
    views: number;
    likes: number;
    comments: number;
  };
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('请输入YouTube视频链接');
      return;
    }
    
    setLoading(true);
    setError(null);
    setVideoInfo(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '请求失败' }));
        throw new Error(errorData.error || '请求失败');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || '解析失败');
      }

      setVideoInfo(data.videoInfo);
    } catch (err) {
      console.error('请求错误:', err);
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* 标题部分 */}
        <div className="text-center mb-16">
          <h1 className="flex items-center justify-center text-6xl font-bold mb-8">
            <FaYoutube className="text-red-600 mr-4" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-300 to-blue-300">
              YouTube视频信息
            </span>
          </h1>
          <p className="text-gray-300 text-xl">
            输入YouTube视频链接，获取视频详细信息
          </p>
        </div>

        {/* 输入表单 */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="relative">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="请输入YouTube视频链接..."
              className="w-full p-4 bg-white/10 rounded-lg border border-white/20 
                text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-2 px-4 py-2 bg-blue-600 text-white rounded
                hover:bg-blue-700 disabled:bg-gray-600 flex items-center"
            >
              {loading ? <FaSpinner className="animate-spin" /> : '获取信息'}
            </button>
          </div>
        </form>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded p-4 mb-8">
            <div className="flex items-center text-red-200">
              <FaInfoCircle className="mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* 视频信息 */}
        {videoInfo && (
          <div className="bg-white/10 rounded-lg overflow-hidden">
            <img
              src={videoInfo.thumbnail}
              alt={videoInfo.title}
              className="w-full h-64 object-cover"
            />
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4">{videoInfo.title}</h2>
              <div className="grid grid-cols-2 gap-4 text-gray-300">
                <div>
                  <p className="text-gray-400">作者</p>
                  <p className="font-medium">{videoInfo.author}</p>
                </div>
                <div>
                  <p className="text-gray-400">时长</p>
                  <p className="font-medium">{videoInfo.duration}</p>
                </div>
                <div>
                  <p className="text-gray-400">观看次数</p>
                  <p className="font-medium">{videoInfo.statistics.views.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-400">点赞数</p>
                  <p className="font-medium">{videoInfo.statistics.likes.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 