'use client';

import { useState } from 'react';
import { FaYoutube, FaSpinner, FaDownload, FaInfoCircle } from 'react-icons/fa';

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
      setError('Please enter a YouTube URL');
      return;
    }
    
    setLoading(true);
    setError(null);
    setVideoInfo(null);

    try {
      console.log('Analyzing URL:', url);
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const text = await response.text();
      console.log('API Response:', { status: response.status, text });

      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error('Failed to parse response:', text);
        throw new Error('Server returned invalid response. Please try again later.');
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
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="flex items-center justify-center text-6xl font-bold mb-6 text-white">
            <FaYoutube className="text-red-600 mr-4" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
              YouTube Analyzer
            </span>
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Analyze YouTube videos quickly and easily. Just paste the URL below.
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste YouTube URL here..."
                className="w-full p-4 pr-36 bg-white/5 rounded-xl border border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-white placeholder-gray-400"
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-2 top-2 px-8 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg transition-all disabled:from-gray-600 disabled:to-gray-700 text-white font-medium"
              >
                {loading ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  'Analyze'
                )}
              </button>
            </div>

            <div className="flex items-center justify-center space-x-8 text-gray-400">
              <div className="flex items-center">
                <FaDownload className="mr-2" />
                <span>Unlimited Analysis</span>
              </div>
              <div className="flex items-center">
                <FaInfoCircle className="mr-2" />
                <span>HD Quality Info</span>
              </div>
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-6 mb-8">
            <div className="flex items-center text-red-200">
              <FaInfoCircle className="mr-3 flex-shrink-0" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Video Info */}
        {videoInfo && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden">
            <img
              src={videoInfo.thumbnail}
              alt={videoInfo.title}
              className="w-full h-64 object-cover"
            />
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-4 text-white">{videoInfo.title}</h2>
              <div className="grid grid-cols-2 gap-4 text-gray-300">
                <div>
                  <p className="text-gray-400">Author</p>
                  <p className="font-medium">{videoInfo.author}</p>
                </div>
                <div>
                  <p className="text-gray-400">Duration</p>
                  <p className="font-medium">{videoInfo.duration}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-12 text-gray-400">
          <h3 className="text-xl font-semibold mb-4 text-white">How to use:</h3>
          <ol className="list-decimal list-inside space-y-2">
            <li>Find a YouTube video you want to analyze</li>
            <li>Copy the video URL from your browser</li>
            <li>Paste the URL in the input field above</li>
            <li>Click "Analyze" and wait for the results</li>
          </ol>
        </div>
      </div>
    </main>
  );
} 