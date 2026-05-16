import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import FileExplorer from '../components/FileExplorer';
import CodeEditor from '../components/Editor';
import Preview from '../components/Preview';
import Chat from '../components/Chat';

const BACKEND_URL = 'https://hatchai-backend.onrender.com'; // adjust if needed

export default function IDE() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [viewMode, setViewMode] = useState('code'); // 'code' | 'preview'

  // Preview states
  const [previewBaseUrl, setPreviewBaseUrl] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('about:blank');
  const [previewError, setPreviewError] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // On mount, try to fetch existing preview URL
  useEffect(() => {
    const getCurrentPreview = async () => {
      try {
        const { data } = await axios.get(`${BACKEND_URL}/preview/`);
        if (data.success && data.previewUrl) {
          setPreviewBaseUrl(data.previewUrl);
          setPreviewError(null);
        }
      } catch {
        // no preview running yet
      }
    };
    getCurrentPreview();
  }, []);

  // Start a new preview server (static or framework)
  const startPreviewServer = useCallback(async () => {
    setIsPreviewLoading(true);
    setPreviewError(null);
    try {
      const { data } = await axios.post(`${BACKEND_URL}/preview/start`);
      if (data.success) {
        const baseUrl = data.previewUrl;
        setPreviewBaseUrl(baseUrl);
        return baseUrl;
      } else {
        throw new Error(data.message || 'Failed to start preview');
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      setPreviewError(msg);
      return null;
    } finally {
      setIsPreviewLoading(false);
    }
  }, []);

  // When a file is selected, prepare the preview URL (does not start it yet)
  // const handleSelectFile = useCallback(
  //   async (file) => {
  //     setSelectedFile(file);
  //     if (!file || !file.endsWith('.html')) {
  //       setPreviewUrl('about:blank');
  //       return;
  //     }

  //     // 1. Get or start the base preview URL
  //     let base = previewBaseUrl;
  //     if (!base) {
  //       base = await startPreviewServer();
  //       if (!base) return; // error shown
  //     }

  //     // 2. Build the final URL
  //     const finalUrl = `${base}/${file}`;
  //     setPreviewUrl(finalUrl);
  //   },
  //   [previewBaseUrl, startPreviewServer]
  // );

  const handleSelectFile = useCallback(async (file) => {
  setSelectedFile(file);
  if (!file || !file.endsWith('.html')) {
    setPreviewUrl('about:blank');
    return;
  }

  let base = previewBaseUrl;
  if (!base) {
    const result = await startPreviewServer(); // now returns { previewPort }
    if (!result) return;
    base = `${BACKEND_URL}/preview/${result.previewPort}`; // like http://backend.com/preview/5432
    setPreviewBaseUrl(base);
  }

  const finalUrl = `${base}/${file}`;
  setPreviewUrl(finalUrl);
}, [previewBaseUrl]);


  // Refresh preview (force reload)
  const handleRefreshPreview = () => {
    if (selectedFile && selectedFile.endsWith('.html') && previewBaseUrl) {
      setPreviewUrl(`${previewBaseUrl}/${selectedFile}`);
    }
  };

  // Switch view mode (and maybe start preview if needed)
  const switchToPreview = async () => {
    if (viewMode === 'preview') return;
    // If no preview yet, start one
    if (!previewBaseUrl && selectedFile && selectedFile.endsWith('.html')) {
      await handleSelectFile(selectedFile); // will set previewUrl
    }
    setViewMode('preview');
  };

  return (
    <div className="ide-container">
      {/* Header */}
      <header className="ide-header">
        <div className="ide-brand">
          <span className="ide-logo">⚡</span>
          <span className="ide-title">Claude Studio</span>
        </div>

        {/* View mode toggle – segmented control */}
        <div className="view-toggle">
          <button
            className={`toggle-btn ${viewMode === 'code' ? 'active' : ''}`}
            onClick={() => setViewMode('code')}
          >
            &lt;/&gt; Code
          </button>
          <button
            className={`toggle-btn ${viewMode === 'preview' ? 'active' : ''}`}
            onClick={switchToPreview}
          >
            👁️ Preview
          </button>
        </div>

        <div className="ide-actions">
          <button className="btn-ghost">Save All</button>
          <button className="btn-ghost">Deploy</button>
        </div>
      </header>

      {/* Main layout */}
      <div className="ide-main">
        {/* File Explorer */}
        <aside className="ide-sidebar">
          <FileExplorer
            selectedFile={selectedFile}
            onSelectFile={handleSelectFile}
          />
        </aside>

        {/* Dynamic content: Editor or Preview */}
        <main className="ide-content-area">
          {viewMode === 'code' ? (
            <CodeEditor selectedFile={selectedFile} />
          ) : (
            <Preview
              previewUrl={previewUrl}
              isLoading={isPreviewLoading}
              error={previewError}
              onRefresh={handleRefreshPreview}
            />
          )}
        </main>

        {/* Chat */}
        <section className="ide-chat">
          <Chat />
        </section>
      </div>
    </div>
  );
}