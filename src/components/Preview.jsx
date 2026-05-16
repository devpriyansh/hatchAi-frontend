import { useState } from 'react';

export default function Preview({ previewUrl, isLoading, error, onRefresh }) {
  const [iframeKey, setIframeKey] = useState(0);

  const handleRefresh = () => {
    setIframeKey((prev) => prev + 1);
    if (onRefresh) onRefresh();
  };

  return (
    <div className="preview-container">
      <div className="preview-toolbar">
        <input
          type="text"
          className={`preview-url ${error ? 'preview-url--error' : ''}`}
          value={
            isLoading
              ? 'Starting preview...'
              : error
              ? `Error: ${error}`
              : previewUrl
          }
          readOnly
        />
        <button
          className="preview-refresh-btn"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          {isLoading ? '⏳' : '↻'}
        </button>
      </div>

      {error ? (
        <div className="preview-error">
          <span className="preview-error-icon">⚠️</span>
          <p>Preview unavailable</p>
          <p className="preview-error-msg">{error}</p>
          <button onClick={handleRefresh} className="preview-retry-btn">
            Retry
          </button>
        </div>
      ) : (
        <iframe
          key={iframeKey}
          src={previewUrl}
          title="preview"
          className="preview-iframe"
        />
      )}
    </div>
  );
}