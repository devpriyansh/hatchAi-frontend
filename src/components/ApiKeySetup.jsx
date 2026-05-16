// components/ApiKeySetup.jsx
import { useState } from 'react';
import axios from 'axios';
import { socket } from '../services/socket';

const BACKEND_URL = 'https://hatchai-backend.onrender.com';

export default function ApiKeySetup({ isOpen, onClose, onKeySet }) {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setError('API key is required');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await axios.post(`${BACKEND_URL}/api/key/set-api-key`, {
        apiKey: apiKey.trim(),
        socketId: socket.id,
      });
      onKeySet(); // Notify parent that key is set
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save key');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>🔑 Enter your Gemini API Key</h2>
        <p className="modal-subtitle">
          Your key is only stored for this session and never saved on disk.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            className="api-key-input"
            placeholder="AIzaSy..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            autoFocus
          />
          {error && <p className="api-key-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Key'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}