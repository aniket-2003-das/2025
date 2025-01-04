import React, { useState, useRef, useEffect } from 'react';
import './Chatbot.css';
import { MessageCircle, Send, Upload, X, Plus } from 'lucide-react';

const DEFAULT_FOLLOW_UPS = [
  "Tell me more about this topic",
  "What are some related subjects?",
  "Can you provide an example?"
];

// Mock API endpoints
const CHAT_API_URL = 'http://localhost:3001/chat';
const UPLOAD_API_URL = 'http://localhost:3001/upload';

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [followUps, setFollowUps] = useState(DEFAULT_FOLLOW_UPS);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);
  const chatAreaRef = useRef(null);

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSend = async (userMessage) => {
    if (userMessage.trim()) {
      const newMessage = { type: 'user', content: userMessage };
      setChatHistory(prevHistory => [...prevHistory, newMessage].slice(-10));
      setIsLoading(true);

      try {
        const response = await fetch(CHAT_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage,
            file: uploadedFile ? uploadedFile.name : null,
          }),
        });

        if (!response.ok) {
          throw new Error('API request failed');
        }

        const data = await response.json();
        const botResponse = data[0]; // Get the first (and only) response from our mock API

        setChatHistory(prevHistory => [...prevHistory, { type: 'bot', content: botResponse.response }].slice(-10));
        setFollowUps(botResponse.followup || DEFAULT_FOLLOW_UPS);
      } catch (error) {
        console.error('Error:', error);
        setChatHistory(prevHistory => [...prevHistory, { type: 'bot', content: 'Sorry, there was an error processing your request.' }].slice(-10));
        setFollowUps(DEFAULT_FOLLOW_UPS);
      } finally {
        setIsLoading(false);
      }

      setMessage('');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        setChatHistory(prevHistory => [...prevHistory, { type: 'user', content: `Uploading file: ${file.name}` }].slice(-10));
        setIsLoading(true);

        // Simulate file upload progress
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 200));
          setUploadProgress(i);
        }

        const response = await fetch(UPLOAD_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fileName: file.name }),
        });

        if (!response.ok) {
          throw new Error('File upload failed');
        }

        const data = await response.json();
        const uploadResponse = data[0]; // Get the first (and only) response from our mock API

        setChatHistory(prevHistory => [...prevHistory, { type: 'bot', content: `${uploadResponse.message} File: ${file.name}` }].slice(-10));
        setFollowUps(uploadResponse.followup || DEFAULT_FOLLOW_UPS);
        setUploadedFile(file);
      } catch (error) {
        console.error('Error:', error);
        setChatHistory(prevHistory => [...prevHistory, { type: 'bot', content: `Failed to upload file: ${file.name}` }].slice(-10));
        setFollowUps(DEFAULT_FOLLOW_UPS);
      } finally {
        setIsLoading(false);
        setUploadProgress(0);
      }
    }
  };

  const handleNewQuery = () => {
    setChatHistory([]);
    setFollowUps(DEFAULT_FOLLOW_UPS);
    setMessage('');
    setUploadedFile(null);
  };

  return (
    <div className="chatbot-container">
      <button className="chatbot-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
      {isOpen && (
        <div className="chatbot-window">
          <div className="chat-area" ref={chatAreaRef}>
            {chatHistory.map((chat, index) => (
              <div key={index} className={`chat-message ${chat.type}-message`}>
                <span className="message-content">{chat.content}</span>
              </div>
            ))}
            {isLoading && (
              <div className="loading">Loading...</div>
            )}
          </div>
          <div className="follow-ups">
            {followUps.map((followUp, index) => (
              <button 
                key={index} 
                onClick={() => handleSend(followUp)}
                className="follow-up-button"
                disabled={isLoading}
              >
                {followUp}
              </button>
            ))}
          </div>
          <div className="input-area">
            <button 
              onClick={handleNewQuery}
              className="icon-button"
              disabled={isLoading}
            >
              <Plus size={20} />
            </button>
            <input 
              type="text" 
              value={message} 
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend(message)}
              className="message-input"
              placeholder="Ask Your Query Here ..."
              disabled={isLoading}
            />

            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileUpload}
              accept=".pdf,.xlsx,.docx"
            />
            <button 
              onClick={() => fileInputRef.current.click()}
              className="icon-button"
              disabled={isLoading}
            >
              <Upload size={20} />
            </button>
            <button 
              onClick={() => handleSend(message)}
              className="action-button"
              disabled={isLoading}
            >
              <Send size={16} />
              <span>Send</span>
            </button>
          </div>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="upload-progress">
              <div 
                className="upload-progress-bar" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
          {uploadedFile && (
            <div className="file-info">
              Uploaded file: {uploadedFile.name}
            </div>
          )}

        </div>
      )}
    </div>
  );
}

export default Chatbot;

