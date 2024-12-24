'use client';

import { useState } from 'react';
import { FaYoutube, FaSpinner, FaDownload, FaInfoCircle, FaLink, FaSearch } from 'react-icons/fa';

interface VideoInfo {
  title: string;
  thumbnail: string;
  duration: string;
  author: string;
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
      const apiUrl = new URL('/api/analyze', window.location.origin);
      console.log('[前端] 发送请求到:', apiUrl.toString());
      console.log('[前端] 请求数据:', { url });
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      console.log('[前端] 响应状态:', response.status);
      console.log('[前端] 响应头:', Object.fromEntries(response.headers));

      const text = await response.text();
      console.log('[前端] 原始响应:', text);

      let data;
      try {
        data = JSON.parse(text);
        console.log('[前端] 解析后的数据:', data);
      } catch (err) {
        console.error('[前端] 解析响应失败:', text);
        throw new Error('服务器返回了无效的响应，请稍后重试');
      }

      if (!response.ok) {
        throw new Error(data.error || '视频分析失败');
      }

      if (!data.success) {
        throw new Error(data.error || '发生未知错误');
      }

      setVideoInfo(data.videoInfo);
    } catch (err) {
      console.error('[前端] 请求错误:', err);
      setError(err instanceof Error ? err.message : '网络请求失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="flex items-center justify-center text-6xl font-bold mb-8">
            <FaYoutube className="text-red-600 mr-4 animate-pulse" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-300 to-blue-300">
              YouTube视频下载
            </span>
          </h1>
          <p className="text-gray-300 text-xl max-w-2xl mx-auto leading-relaxed">
            快速、简单、高效地下载YouTube视频
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 mb-12 transform hover:scale-[1.02] transition-all duration-300">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl opacity-75 group-hover:opacity-100 transition-opacity blur-lg"></div>
              <div className="relative">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="在此粘贴YouTube视频链接..."
                  className="w-full p-5 pr-40 bg-black/40 rounded-xl border-2 border-white/20 
                    focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none 
                    transition-all text-blue-100 placeholder-gray-400 text-lg"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="absolute right-2 top-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 
                    hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all 
                    disabled:from-gray-600 disabled:to-gray-700 text-white font-medium
                    transform hover:scale-105 active:scale-95 flex items-center space-x-2"
                >
                  {loading ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <>
                      <FaSearch />
                      <span>分析</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-gray-300">
              <div className="flex items-center space-x-3 bg-white/5 p-4 rounded-xl">
                <FaDownload className="text-blue-400 text-xl" />
                <span>无限制分析</span>
              </div>
              <div className="flex items-center space-x-3 bg-white/5 p-4 rounded-xl">
                <FaInfoCircle className="text-purple-400 text-xl" />
                <span>高清信息</span>
              </div>
              <div className="flex items-center space-x-3 bg-white/5 p-4 rounded-xl">
                <FaLink className="text-green-400 text-xl" />
                <span>支持所有链接</span>
              </div>
            </div>
          </form>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-6 mb-8 animate-shake">
            <div className="flex items-center text-red-200">
              <FaInfoCircle className="mr-3 flex-shrink-0" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {videoInfo && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden 
            transform hover:scale-[1.01] transition-all duration-300 animate-fade-in">
            <div className="relative">
              <img
                src={videoInfo.thumbnail}
                alt={videoInfo.title}
                className="w-full h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            </div>
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-6 text-white">{videoInfo.title}</h2>
              <div className="grid grid-cols-2 gap-6 text-gray-300">
                <div className="bg-white/5 p-4 rounded-xl">
                  <p className="text-gray-400 mb-1">作者</p>
                  <p className="font-medium text-lg">{videoInfo.author}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl">
                  <p className="text-gray-400 mb-1">时长</p>
                  <p className="font-medium text-lg">{videoInfo.duration}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-16 text-gray-400 bg-white/5 rounded-2xl p-8">
          <h3 className="text-2xl font-semibold mb-6 text-white">使用说明</h3>
          <ol className="space-y-4">
            {[
              '找到想要分析的YouTube视频',
              '从浏览器复制视频链接',
              '��链接粘贴上方输入框',
              '点击"分析"按钮等待结果'
            ].map((step, index) => (
              <li key={index} className="flex items-center space-x-4">
                <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-blue-400">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </main>
  );
} 