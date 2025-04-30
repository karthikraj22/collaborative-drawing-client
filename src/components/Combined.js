import React, { useState, useEffect } from "react";
import {
  Badge,
  Alert,
  Button,
  Row,
  Col,
  Form,
  InputGroup
} from "react-bootstrap";
import {
   FaMicrophone,
  FaStop,
  FaPaperPlane,
  FaVolumeUp,
  FaHeadset,
  FaDesktop,
  FaUsers,
  FaCircle,
} from "react-icons/fa";
import "../styles/Combined.css";

const CombinedPage = ({
  users,
  messages,
  currentUser,
  onSendMessage,
  onSendAudioMessage,
  startRecording,
  stopRecording,
  startLiveSpeaking,
  stopLiveSpeaking,
  startScreenSharing,
  stopScreenSharing,
  isRecording,
  isLiveSpeaking,
  isScreenSharing,
  audioBlob,
  setAudioBlob,
}) => {
  const [notifications, setNotifications] = useState([]);
  const [textMessage, setTextMessage] = useState("");
  const [showUserList, setShowUserList] = useState(false);

  useEffect(() => {
    if (users.length === 0) return;

    const lastUser = users[users.length - 1];

    if (lastUser && lastUser.username !== currentUser) {
      setNotifications((prev) => [
        ...prev,
        { message: `${lastUser.username} has joined`, type: "join" },
      ]);
    }

    const timer = setTimeout(() => {
      setNotifications((prev) => prev.slice(1));
    }, 3000);

    return () => clearTimeout(timer);
  }, [users, currentUser]);

  const handleSendTextMessage = () => {
    if (textMessage.trim()) {
      onSendMessage(textMessage);
      setTextMessage("");
    }
  };

  const handleSendAudioMessageLocal = () => {
    if (audioBlob) {
      onSendAudioMessage();
      setAudioBlob(null);
    }
  };

  return (
    <div className="combined-page d-flex flex-column right-panel bg-light shadow-sm rounded p-3 position-relative">
      <div className="chat-header d-flex align-items-center justify-content-between mb-3 px-3 py-2 bg-white rounded shadow-sm">
        <h4 className="mb-0 " style={{ color: "#333", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
          Chats
        </h4>
        <Button
          variant="outline-primary"
          onClick={() => setShowUserList(true)}
          aria-label="Show online users"
          title="Show Online Users"
          className="rounded-circle p-2 d-flex align-items-center justify-content-center"
          style={{ width: "42px", height: "42px" }}
        >
          <FaUsers size={22} />
        </Button>
      </div>

      {/* Chat Box Container */}
      <div
        className="chat-box bg-white rounded shadow-sm flex-grow-1 overflow-auto p-4"
        style={{ maxHeight: "60vh", minHeight: "320px", scrollbarWidth: "thin" }}
      >
        {messages.length === 0 && (
          <div className="text-center text-muted mt-5" style={{ fontStyle: "italic" }}>
            No messages yet
          </div>
        )}
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message-bubble ${
              msg.username === currentUser ? "sent" : "received"
            } shadow-sm p-3 mb-3 rounded-3`}
            style={{
              maxWidth: "75%",
              alignSelf: msg.username === currentUser ? "flex-end" : "flex-start",
              backgroundColor:
                msg.username === currentUser
                  ? "linear-gradient(135deg, #667eea, #764ba2)"
                  : "linear-gradient(135deg, #f0f4ff, #d9e2ff)",
              color: msg.username === currentUser ? "#fff" : "#2c3e50",
              boxShadow:
                msg.username === currentUser
                  ? "0 6px 15px rgba(102, 126, 234, 0.6)"
                  : "0 6px 15px rgba(217, 226, 255, 0.6)",
              fontWeight: "500",
              fontSize: "1rem",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            }}
          >
            <div className="message-header d-flex justify-content-between mb-1">
              <strong
                className="username"
                style={{
                  color: msg.username === currentUser ? "#d1d5db" : "#34495e",
                  fontWeight: "700",
                  fontSize: "0.9rem",
                }}
              >
                {msg.username === currentUser ? "You" : msg.username}
              </strong>
              <small className="timestamp text-light" style={{ opacity: 0.7 }}>
                {msg.timestamp}
              </small>
            </div>
            <div className="message-body">
              {msg.type === "text" ? (
                msg.message
              ) : (
                <audio controls className="w-100" style={{ borderRadius: "8px" }}>
                  <source
                    src={URL.createObjectURL(
                      new Blob([msg.message], { type: "audio/webm" })
                    )}
                    type="audio/webm"
                  />
                  Your browser does not support the audio element.
                </audio>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Message Input & Controls */}
      <div className="message-input-container border-top pt-3 mt-3">
        <Row className="align-items-center justify-content-between mb-2 g-2">
          <Col xs={4} sm={3} className="d-flex justify-content-center">
            <Button
              variant={isRecording ? "danger" : "outline-danger"}
              onClick={isRecording ? stopRecording : startRecording}
              title={isRecording ? "Stop Recording" : "Start Recording"}
              aria-pressed={isRecording}
              className="rounded-circle p-2"
              style={{ width: "45px", height: "45px" }}
            >
              {isRecording ? <FaStop size={20} /> : <FaMicrophone size={20} />}
            </Button>
          </Col>

          <Col xs={4} sm={3} className="d-flex justify-content-center">
            <Button
              variant={isLiveSpeaking ? "danger" : "outline-success"}
              onClick={isLiveSpeaking ? stopLiveSpeaking : startLiveSpeaking}
              title={isLiveSpeaking ? "Stop Live Speaking" : "Start Live Speaking"}
              aria-pressed={isLiveSpeaking}
              className="rounded-circle p-2"
              style={{ width: "45px", height: "45px" }}
            >
              {isLiveSpeaking ? <FaStop size={20} /> : <FaHeadset size={20} />}
            </Button>
          </Col>

          <Col xs={4} sm={3} className="d-flex justify-content-center">
            <Button
              variant={isScreenSharing ? "danger" : "outline-primary"}
              onClick={isScreenSharing ? stopScreenSharing : startScreenSharing}
              title={isScreenSharing ? "Stop Screen Sharing" : "Start Screen Sharing"}
              aria-pressed={isScreenSharing}
              className="rounded-circle p-2"
              style={{ width: "45px", height: "45px" }}
            >
              {isScreenSharing ? <FaStop size={20} /> : <FaDesktop size={20} />}
            </Button>
          </Col>
        </Row>

        <Row className="mt-3">
  <Col xs={12}>
    <InputGroup>
      <Form.Control
        type="text"
        placeholder="Type your message..."
        value={textMessage}
        onChange={(e) => setTextMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendTextMessage();
          }
        }}
        aria-label="Message input"
        style={{ borderRadius: "20px", paddingRight: "2.5rem" }}
      />
      <Button
  variant="primary"
  onClick={handleSendTextMessage}
  disabled={!textMessage.trim()}
  aria-label="Send message"
  style={{
    position: "absolute",
    right: "1px",
    top: "50%",
    transform: "translateY(-50%)",
    borderRadius: "50%", 
    width: "36px",
    height: "36px",
    padding: 0, 
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden", 
    zIndex: 5,
    cursor: textMessage.trim() ? "pointer" : "not-allowed",
  }}
>
  <FaPaperPlane size={18} />
</Button>

    </InputGroup>
  </Col>
</Row>

      </div>

      {/* ===========================
          Stylish Sidebar for Online Users (popup style)
          =========================== */}
      {showUserList && (
        <>
          {/* Backdrop with blur */}
          <div
            onClick={() => setShowUserList(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgba(0,0,0,0.25)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              zIndex: 1040,
              cursor: "pointer",
            }}
            aria-hidden="true"
          />

          {/* Sidebar panel */}
          <aside
            role="complementary"
            aria-label="Online users sidebar"
            style={{
              position: "fixed",
              top: "10vh",
              right: "1rem",
              maxHeight: "80vh",
              width: "320px",
              background:
                "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              boxShadow: "0 8px 24px rgba(102, 126, 234, 0.6)",
              zIndex: 1050,
              display: "flex",
              flexDirection: "column",
              padding: "1.5rem",
              overflowY: "auto",
              borderRadius: "16px",
              color: "#f0f4ff",
              fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
              transition: "transform 0.3s ease-out",
              transform: "translateX(0)", // visible
            }}
          >
            <header style={{ marginBottom: "1.25rem" }}>
              <h5 className="mb-0" style={{ fontWeight: "700" }}>
                Online Users ({users.length})
              </h5>
            </header>

            {/* Notifications */}
            {notifications.length > 0 && (
              <div className="mb-3">
                {notifications.map((notification, idx) => (
                  <Alert
                    key={idx}
                    variant="light"
                    className="py-1 px-3 mb-1 rounded-pill"
                    style={{
                      fontSize: "0.9rem",
                      backgroundColor: "rgba(255,255,255,0.15)",
                      color: "#e0e7ff",
                      border: "1px solid rgba(255,255,255,0.3)",
                    }}
                  >
                    {notification.message}
                  </Alert>
                ))}
              </div>
            )}

            {/* Current User */}
            {users.find((u) => u.username === currentUser) && (
              <div
                className="d-flex align-items-center mb-4 p-3 rounded shadow"
                style={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  border: "1px solid rgba(255,255,255,0.3)",
                }}
              >
                <div
                  className="avatar bg-white text-indigo-700 rounded-circle d-flex justify-content-center align-items-center me-3"
                  style={{
                    width: 50,
                    height: 50,
                    fontSize: "1.5rem",
                    userSelect: "none",
                    color: "#5a3eeb",
                    fontWeight: "700",
                    boxShadow: "0 0 8px rgba(90, 62, 235, 0.6)",
                  }}
                  aria-label="Current user avatar"
                >
                  {currentUser.charAt(0).toUpperCase()}
                </div>
                <div>
                  <strong className="fs-5" style={{ color: "#f0f4ff" }}>
                    {currentUser}
                  </strong>
                  <Badge
                    bg="warning"
                    text="dark"
                    className="ms-2"
                    style={{ fontWeight: "600" }}
                  >
                    You
                  </Badge>
                  <div className="text-light small" style={{ opacity: 0.8 }}>
                    Joined at {sessionStorage.getItem("joinTime") || "Just now"}
                  </div>
                </div>
              </div>
            )}

            {/* Other Users List */}
            <div role="list" aria-label="List of online users" style={{ flexGrow: 1 }}>
              {users.length > 1 ? (
                users
                  .filter((u) => u.username !== currentUser)
                  .map((user, idx) => (
                    <div
                      key={idx}
                      className="d-flex align-items-center justify-content-between py-2 px-3 mb-2 rounded hover-shadow"
                      role="listitem"
                      tabIndex={0}
                      style={{
                        cursor: "default",
                        userSelect: "none",
                        backgroundColor: "rgba(255,255,255,0.1)",
                        transition: "background-color 0.3s ease",
                      }}
                      aria-label={`User ${user.username}`}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.25)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)")
                      }
                    >
                      <div className="d-flex align-items-center">
                        <div
                          className="avatar bg-white text-indigo-700 rounded-circle d-flex justify-content-center align-items-center me-3"
                          style={{
                            width: 40,
                            height: 40,
                            fontSize: "1.25rem",
                            userSelect: "none",
                            color: "#5a3eeb",
                            fontWeight: "700",
                            boxShadow: "0 0 6px rgba(90, 62, 235, 0.5)",
                          }}
                          aria-hidden="true"
                        >
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <strong style={{ color: "#f0f4ff" }}>{user.username}</strong>
                      </div>
                      <FaCircle
                        color="#34d399" // bright green
                        title="Online"
                        aria-label="Online status"
                        style={{ fontSize: "0.75rem" }}
                      />
                    </div>
                  ))
              ) : (
                <p className="text-light text-center my-3" style={{ opacity: 0.8 }}>
                  No other users online
                </p>
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  );
};

export default CombinedPage;
