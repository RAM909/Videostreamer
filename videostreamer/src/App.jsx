import React, { useState, useEffect } from 'react';
import axios from 'axios';

const App = () => {
  const [videos, setVideos] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/videos');
      console.log(response.data);
      // setVideos(response.data);

      response.data.map((video) => {
        video.webViewLink = video.webViewLink.replace('view', 'preview');
        return video;
      }
      );
      setVideos(response.data);
      console.log(response.data);
    } catch (error) {
      console.error('Error fetching videos', error);
    }
  };

  const uploadVideo = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('video', file);

    try {
      await axios.post('http://localhost:4000/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFile(null);
      fetchVideos();
    } catch (error) {
      console.error('Error uploading video', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4">
        <h1 className="text-center text-xl font-bold">Video Management</h1>
      </header>

      <div className="max-w-4xl mx-auto p-4">
        {/* Admin Upload Section */}
        <div className="mb-6 bg-white p-4 shadow rounded">
          <h2 className="text-lg font-bold mb-4">Admin: Upload Video</h2>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setFile(e.target.files[0])}
            className="block w-full mb-4"
          />
          <button
            onClick={uploadVideo}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
            disabled={!file || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Video'}
          </button>
        </div>

        {/* User Video Section */}
        <div>
          <h2 className="text-lg font-bold mb-4">Videos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video) => (
              <div
                key={video.id}
                className="bg-white shadow p-4 rounded"
              >
                <iframe
                  src={video.webViewLink}
                  allow="autoplay"
                  className="w-full h-56"
                  frameBorder="0"
                  allowFullScreen
                ></iframe>
                <p className="mt-2 text-center font-semibold">
                  {video.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
