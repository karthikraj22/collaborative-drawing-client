import React, { useState, useRef, useEffect } from "react";
import { FaMicrophone, FaStop, FaHeadset } from "react-icons/fa";
import "../styles/MessageInput.css";

const MessageInput = ({
  onSendMessage,
  onSendAudioMessage,
  startRecording,
  stopRecording,
  startLiveSpeaking,
  stopLiveSpeaking,
  isRecording,
  isLiveSpeaking,
  audioBlob,
  setAudioBlob,  // added setAudioBlob to reset the blob after sending message
  setIsRecording, // added setIsRecording to reset recording state
}) => {
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Automatically stop listening when recording stops
    if (!isRecording) {
      // If the microphone is stopped after recording, reset the audio preview
      setAudioBlob(null);
    }
  }, [isRecording, setAudioBlob]);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage(""); // Clear message input after sending
    }

    if (audioBlob) {
      // Send audio message after stopping the recording
      onSendAudioMessage(audioBlob);
      setAudioBlob(null); // Reset audio blob after sending
      setIsRecording(false); // Reset recording state
    }
  };

  return (
    <div className="message-input">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        rows="2"
      />
      <div className="message-actions">
        {/* Live speaking button */}
        {isLiveSpeaking ? (
          <button className="live-speaking-btn stop-btn" onClick={stopLiveSpeaking}>
            <FaStop />
            <span className="recording-status">Live Speaking...</span>
          </button>
        ) : (
          <button className="live-speaking-btn" onClick={startLiveSpeaking}>
            <FaHeadset />
            <span>Live</span>
          </button>
        )}

        {/* Audio recording button */}
        {isRecording ? (
          <button className="recording-btn stop-btn" onClick={() => stopRecording()}>
            <FaStop />
            <span className="recording-status">Recording...</span>
          </button>
        ) : (
          <button className="audio-btn" onClick={() => startRecording()}>
            <FaMicrophone />
          </button>
        )}

        {/* Show the recorded audio preview if available */}
        {audioBlob && !isRecording && (
          <div className="audio-preview">
            <audio controls>
              <source src={URL.createObjectURL(audioBlob)} type="audio/wav" />
              Your browser does not support the audio element.
            </audio>
            <button className="send-btn" onClick={handleSend}>
              Send
            </button>
          </div>
        )}

        {/* Send text message if no audio recorded */}
        {!audioBlob && (
          <button className="send-btn" onClick={handleSend}>
            Send
          </button>
        )}
      </div>
    </div>
  );
};

export default MessageInput;
