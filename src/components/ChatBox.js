import React from 'react';
import "../styles/ChatBox.css";

const ChatBox = ({ messages, currentUser }) => {
    console.log("Audio Messages",messages);
    
    return (
        <div className="chat-box">
            {messages.map((msg, index) => (
                <div
                    key={index}
                    className={`message-bubble ${msg.username === currentUser ? "sent" : "received"}`}
                >
                    <div className="message-header">
                        <span className="username">{msg.username}</span>
                        <span className="timestamp">{msg.timestamp}</span>
                    </div>
                    <div className="message-body">
                        {msg.type === "text" ? (
                            <p>{msg.message}</p>
                        ) :msg.type === "audio" ? (
                            <audio controls>
                                <source 
                                    src={URL.createObjectURL(new Blob([msg.message], { type: 'audio/webm' }))} 
                                    type="audio/webm" 
                                />
                                Your browser does not support the audio element.
                            </audio>
                        ) : null
                        
        }
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ChatBox;
