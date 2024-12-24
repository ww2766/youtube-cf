'use client';

import { useState } from 'react';
import { FaYoutube, FaSpinner } from 'react-icons/fa';

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

      const text = await response.text();
      console.log('Response:', { status: response.status, text });

      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error('Failed to parse response:', text);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze video');
      }

      if (data.success) {
        setVideoInfo(data.videoInfo);
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze video');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="flex items-center justify-center text-5xl font-bold mb-4">
            <FaYoutube className="text-red-600 mr-4" />
            YouTube Analyzer
          </h1>
          <p className="text-gray-400">
            Enter a YouTube URL to analyze video information
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-xl p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste YouTube URL here..."
                className="w-full p-4 pr-32 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-2 top-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:bg-gray-500"
              >
                {loading ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  'Analyze'
                )}
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 rounded-lg p-4 mb-8">
            {error}
          </div>
        )}

        {videoInfo && (
          <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
            <img
              src={videoInfo.thumbnail}
              alt={videoInfo.title}
              className="w-full object-cover"
            />
            <div className="p-6">
              <h2 className="text-xl font-bold mb-2">{videoInfo.title}</h2>
              <div className="text-gray-400">
                <p>Author: {videoInfo.author}</p>
                <p>Duration: {videoInfo.duration}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 