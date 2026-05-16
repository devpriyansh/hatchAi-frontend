// components/Chat.jsx
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { socket } from '../services/socket';
import ApiKeySetup from './ApiKeySetup';

const BACKEND_URL = 'https://hatchai-backend.onrender.com';
// const BACKEND_URL = 'http://localhost:3002';

export default function Chat() {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([]);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [showKeySetup, setShowKeySetup] = useState(false);
  const chatEndRef = useRef(null);

  // On mount, ask backend if a key is already stored for this socket
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const { data } = await axios.get(`${BACKEND_URL}/api/key/has-api-key?socketId=${socket.id}`);
        if (data.hasKey) {
          setHasApiKey(true);
        } else {
          setShowKeySetup(true); // prompt user
        }
      } catch {
        setShowKeySetup(true);
      }
    };
    if (socket.id) checkApiKey();
    else socket.on('connect', checkApiKey);
    return () => socket.off('connect', checkApiKey);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket listeners for AI streaming
  useEffect(() => {
    const handleStream = (data) => {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === 'assistant') {
          return [...prev.slice(0, -1), { ...last, text: last.text + data.content }];
        }
        return [...prev, { role: 'assistant', text: data.content }];
      });
    };

    const handleTerminal = (data) => {
      setMessages((prev) => [...prev, { role: 'system', text: data.content }]);
    };

    socket.on('ai:stream', handleStream);
    socket.on('terminal:data', handleTerminal);
    return () => {
      socket.off('ai:stream', handleStream);
      socket.off('terminal:data', handleTerminal);
    };
  }, []);

  // const sendMessage = async () => {
  //   const trimmed = prompt.trim();
  //   if (!trimmed || !hasApiKey) return;

  //   setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
  //   try {
  //     await axios.post(`${BACKEND_URL}/api/ai/chat`, {
  //       prompt: trimmed,
  //       socketId: socket.id,
  //     });
  //   } catch (error) {
  //     console.error('Chat error:', error);
  //     setMessages((prev) => [
  //       ...prev,
  //       { role: 'system', text: '❌ Failed to get AI response.' },
  //     ]);
  //   }
  //   setPrompt('');
  // };

  const sendMessage = async () => {
  const trimmed = prompt.trim();

  if (!trimmed || !hasApiKey) return;

  // add user message
  setMessages((prev) => [
    ...prev,
    { role: 'user', text: trimmed }
  ]);

  // clear input immediately
  setPrompt('');

  try {

    await axios.post(`${BACKEND_URL}/api/ai/chat`, {
      prompt: trimmed,
      socketId: socket.id,
    });

  } catch (error) {

    console.error('Chat error:', error);

    /*
      BACKEND ERROR DATA
    */
    const status = error?.response?.status;
    const errorData = error?.response?.data;
    const errorCode = errorData?.error?.code;
    const backendMessage = errorData?.error?.message;

    let userMessage = '❌ Something went wrong. Please try again.';

    /*
      USER FRIENDLY ERRORS
    */

    switch (errorCode) {

      case 'INVALID_API_KEY':
        userMessage =
          '🔑 Your Gemini API key is invalid. Please check and re-enter it.';
        setHasApiKey(false);
        break;

      case 'API_KEY_MISSING':
        userMessage =
          '🔑 Please add your Gemini API key first.';
        setHasApiKey(false);
        setShowKeySetup(true);
        break;

      case 'TOKEN_LIMIT_EXCEEDED':
        userMessage =
          '📏 Your message is too long for the AI model. Try shortening it.';
        break;

      case 'RATE_LIMIT_EXCEEDED':
        userMessage =
          '⏳ Too many requests. Please wait a few seconds and try again.';
        break;

      case 'QUOTA_EXCEEDED':
        userMessage =
          '💳 Your Gemini API quota has been exhausted.';
        break;

      case 'MODEL_NOT_FOUND':
        userMessage =
          '🤖 AI model is currently unavailable.';
        break;

      case 'SOCKET_NOT_FOUND':
        userMessage =
          '🔌 Connection lost. Please refresh the page.';
        break;

      case 'PROMPT_REQUIRED':
        userMessage =
          '✍️ Please enter a message.';
        break;

      case 'ACCESS_DENIED':
        userMessage =
          '🚫 Access denied for this API key.';
        break;

      case 'REQUEST_TIMEOUT':
        userMessage =
          '⌛ AI took too long to respond. Please try again.';
        break;

      case 'MAX_ITERATIONS_REACHED':
        userMessage =
          '⚠️ AI stopped because too many tool operations were performed.';
        break;

      default:

        // fallback using status codes

        if (status === 401) {
          userMessage =
            '🔑 Authentication failed. Please check your API key.';
        }

        else if (status === 429) {
          userMessage =
            '⏳ Too many requests. Please try again later.';
        }

        else if (status === 500) {
          userMessage =
            '🚨 Internal server error. Please try again later.';
        }

        else if (!navigator.onLine) {
          userMessage =
            '📡 No internet connection.';
        }

        else if (backendMessage) {
          userMessage = `❌ ${backendMessage}`;
        }
    }

    // add system message
    setMessages((prev) => [
      ...prev,
      {
        role: 'system',
        text: userMessage
      }
    ]);
  }
};

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const openKeySetup = () => setShowKeySetup(true);

  return (
    <>
      <div className="chat-container">
        {/* Messages */}
        <div className="chat-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-bubble chat-bubble--${msg.role}`}>
              <span className="chat-role">
                {msg.role === 'user' ? 'You' : msg.role === 'assistant' ? 'AI' : 'System'}
              </span>
              <p className="chat-text">{msg.text}</p>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input area – disabled if no key */}
        <div className="chat-input-area">
          <input
            type="text"
            className="chat-input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={hasApiKey ? 'Ask Claude to build your website...' : 'Set your API key first'}
            disabled={!hasApiKey}
          />
          <button
            className="chat-send-btn"
            onClick={sendMessage}
            disabled={!hasApiKey}
          >
            ➤
          </button>
        </div>

        {/* Small settings icon to open key setup */}
        <button className="chat-key-btn" onClick={openKeySetup} title="Set API Key">
          🔑
        </button>
      </div>

      {/* Modal */}
      <ApiKeySetup
        isOpen={showKeySetup}
        onClose={() => setShowKeySetup(false)}
        onKeySet={() => setHasApiKey(true)}
      />
    </>
  );
}