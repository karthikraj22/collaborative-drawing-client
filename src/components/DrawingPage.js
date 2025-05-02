import React, { useState, useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import { useNavigate } from "react-router-dom";
import CanvasBoard from "./CanvasBoard";
import CombinedPage from "./Combined";
import NavBar from "./Navbar";
import { Container, Row, Col } from "react-bootstrap";
import "../styles/DrawingPage.css";
import { MdFullscreen, MdFullscreenExit } from "react-icons/md";

const DrawingPage = ({ setUsername, setRoom }) => {
  const navigate = useNavigate();
  const socket = useSocket();

  const videoRef = useRef(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState("");

  // Audio
  const [isLiveSpeaking, setIsLiveSpeaking] = useState(false);
  const [audioPeer, setAudioPeer] = useState(null);
  const [audioStream, setAudioStream] = useState(null);
  const [audioIceQueue, setAudioIceQueue] = useState([]);

  // Screen sharing
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  const [screenPeer, setScreenPeer] = useState(null);
  const [screenIceQueue, setScreenIceQueue] = useState([]);
  const [isMaximized, setIsMaximized] = useState(false);
  const [videoStreams, setVideoStreams] = useState([]);
  const [isVideoMaximized, setIsVideoMaximized] = useState(false);

  const [dragPosition, setDragPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Recording
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);

  const createPeerConnection = (type) => {
    console.log(`[${type.toUpperCase()}] Creating peer connection`);
    const configuration = {
      iceServers: [
        {
          urls: process.env.REACT_APP_TURN_URL,
          username: process.env.REACT_APP_TURN_USERNAME,
          credential: process.env.REACT_APP_TURN_CREDENTIAL,
        },
      ],
    };

    const pc = new RTCPeerConnection(configuration);
    console.log("",pc);
    
    const connectionState = pc.connectionState;
    console.log("Connection State:", connectionState);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`[${type.toUpperCase()}] Local ICE candidate:`, event.candidate);
        socket.emit(`${type}IceCandidate`, event.candidate);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[${type.toUpperCase()}] ICE connection state:`, pc.iceConnectionState);
    };

    return pc;
  };

  // Audio functions
  const startLiveSpeaking = async () => {
    console.log("[AUDIO] Starting live speaking...");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const pc = createPeerConnection("audio");

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
      console.log("[AUDIO] Added audio track:", track);
    });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    console.log("[AUDIO] Sent audio offer:", offer);
    socket.emit("audioOffer", offer);

    setAudioPeer(pc);
    setAudioStream(stream);
    setIsLiveSpeaking(true);
  };

  const stopLiveSpeaking = () => {
    console.log("[AUDIO] Stopping live speaking...");
    audioStream?.getTracks().forEach((t) => t.stop());
    setAudioStream(null);
    setAudioPeer(null);
    setIsLiveSpeaking(false);
  };

  const handleAudioAnswer = async (answer) => {
    console.log("[AUDIO] Received answer:", answer);
    if (audioPeer) {
      await audioPeer.setRemoteDescription(new RTCSessionDescription(answer));
    }
  };

  const handleAudioIce = async (candidate) => {
    console.log("[AUDIO] Received remote ICE candidate:", candidate);
    if (!audioPeer || !audioPeer.remoteDescription) {
      setAudioIceQueue((q) => [...q, candidate]);
    } else {
      await audioPeer.addIceCandidate(new RTCIceCandidate(candidate));
    }
  };

  // Screen sharing functions
  const startScreenSharing = async () => {
    console.log("[SCREEN] Starting screen sharing...");
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const pc = createPeerConnection("screen");

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
      console.log("[SCREEN] Added screen track:", track);
    });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    console.log("[SCREEN] Sent screen offer:", offer);
    socket.emit("screenOffer", offer);

    setScreenPeer(pc);
    setScreenStream(stream);
    setIsScreenSharing(true);
  };

  const stopScreenSharing = () => {
    console.log("[SCREEN] Stopping screen sharing...");
    screenStream?.getTracks().forEach((t) => t.stop());
    setScreenStream(null);
    setScreenPeer(null);
    setIsScreenSharing(false);
    socket.emit("screenShareStopped");
  };

  const handleScreenAnswer = async (answer) => {
    console.log("[SCREEN] Received screen answer:", answer);
    if (screenPeer) {
      await screenPeer.setRemoteDescription(new RTCSessionDescription(answer));
    }
  };

  const handleScreenIce = async (candidate) => {
    console.log("[SCREEN] Received remote ICE candidate:", candidate);
    if (!screenPeer || !screenPeer.remoteDescription) {
      setScreenIceQueue((q) => [...q, candidate]);
    } else {
      await screenPeer.addIceCandidate(new RTCIceCandidate(candidate));
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm;codecs=opus" });
        console.log("[RECORDING] Recording stopped. Blob size:", blob.size);
        setAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaStreamRef.current = stream;

      mediaRecorder.start();
      setIsRecording(true);
      console.log("[RECORDING] Recording started");
    } catch (err) {
      console.error("[RECORDING] Failed to start recording:", err);
      alert("Microphone access denied or unsupported browser.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log("[RECORDING] Stopped recording");
    }
  };

  const handleSendMessage = (message) => {
    if (message.trim()) {
      socket.emit("chatMessage", { message });
    }
  };

  const handleSendAudioMessage = () => {
    if (audioBlob) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          console.log("[AUDIO MESSAGE] Sending audio message, size:", reader.result.byteLength);
          socket.emit("audioMessage", { audio: reader.result });
          setAudioBlob(null);
        } else {
          console.warn("[AUDIO MESSAGE] Empty audio data");
        }
      };
      reader.readAsArrayBuffer(audioBlob);
    } else {
      console.warn("[AUDIO MESSAGE] No audioBlob to send");
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - dragPosition.x,
      y: e.clientY - dragPosition.y,
    };
    e.stopPropagation();
  };

  const handleMouseMove = (e) => {
    if (isDragging && !isMaximized) {
      setDragPosition({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    const storedUsername = sessionStorage.getItem("username");
    const storedRoom = sessionStorage.getItem("room");

    if (!storedUsername || !storedRoom) {
      navigate("/");
      return;
    }

    setUsername(storedUsername);
    setRoom(storedRoom);
    setCurrentUser(storedUsername);

    socket.emit("joinRoom", { username: storedUsername, room: storedRoom });

    socket.on("userList", setUsers);
    socket.on("message", (m) => setMessages((prev) => [...prev, m]));

    socket.on("audioAnswer", handleAudioAnswer);
    socket.on("audioIceCandidate", handleAudioIce);
    socket.on("screenAnswer", handleScreenAnswer);
    socket.on("screenIceCandidate", handleScreenIce);

    socket.on("screenOffer", async (offer) => {
      console.log("[SCREEN] Received screen offer:", offer);
      const pc = createPeerConnection("screen");

      pc.ontrack = (event) => {
        const remoteStream = event.streams[0];
        if (remoteStream) {
          console.log("[SCREEN] Received remote screen stream");
          setVideoStreams((prev) => [...prev, remoteStream]);
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("screenAnswer", answer);
      setScreenPeer(pc);
    });

    socket.on("screenShareStopped", () => {
      console.log("[SCREEN] Screen share stopped by remote user");
      setVideoStreams([]);
    });

    return () => {
      socket.off("userList");
      socket.off("message");
      socket.off("audioAnswer");
      socket.off("audioIceCandidate");
      socket.off("screenAnswer");
      socket.off("screenIceCandidate");
      socket.off("screenOffer");
      socket.off("screenShareStopped");
    };
  }, [socket]);

  useEffect(() => {
    audioIceQueue.forEach(async (candidate) => {
      if (audioPeer) {
        console.log("[AUDIO] Applying queued ICE candidate");
        await audioPeer.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });
    setAudioIceQueue([]);
  }, [audioPeer]);

  useEffect(() => {
    screenIceQueue.forEach(async (candidate) => {
      if (screenPeer) {
        console.log("[SCREEN] Applying queued ICE candidate");
        await screenPeer.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });
    setScreenIceQueue([]);
  }, [screenPeer]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    if (videoRef.current && screenStream) {
      videoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  return (
    <div>
      <NavBar />
      <div className="drawing-page">
        <Container fluid>
          <Row className="align-items-start justify-content-between">
            <Col md={isScreenSharing ? 8 : 6} className="canvas-container">
              <CanvasBoard />
              {isScreenSharing && screenStream && (
                <div
                  className={`screen-share-popup ${isMaximized ? "maximized" : ""}`}
                  style={
                    isMaximized
                      ? {}
                      : {
                        position: "fixed",
                        left: `${dragPosition.x}px`,
                        top: `${dragPosition.y}px`,
                        zIndex: 1000,
                      }
                  }
                  onMouseDown={handleMouseDown}
                >
                  <video
                    ref={videoRef}
                    className="screen-share-video"
                    autoPlay
                    muted
                    playsInline
                  />
                  <button
                    className="toggle-maximize-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMaximized(!isMaximized);
                    }}
                  >
                    {isMaximized ? <MdFullscreenExit /> : <MdFullscreen />}
                  </button>
                </div>
              )}
              {!isScreenSharing && videoStreams.length > 0 && (
                <div className="remote-videos">
                  {videoStreams.map((stream, index) => (
                    <div
                      key={index}
                      className={`remote-video-popup ${isVideoMaximized ? "maximized" : ""}`}
                      style={
                        isVideoMaximized
                          ? {}
                          : {
                            left: `${dragPosition.x + index * 330}px`,
                            top: `${dragPosition.y}px`,
                          }
                      }
                      onMouseDown={handleMouseDown}
                    >
                      <video
                        id={`remote-video-${index}`}
                        className="remote-video-element"
                        autoPlay
                        playsInline
                        muted
                        ref={(video) => {
                          if (video && stream && video.srcObject !== stream) {
                            video.srcObject = stream;
                            video.play().catch((err) => {
                              console.error("Error playing remote video:", err);
                            });
                          }
                        }}
                      />
                      <button
                        className="toggle-maximize-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsVideoMaximized(!isVideoMaximized);
                        }}
                        aria-label={isVideoMaximized ? "Minimize remote video" : "Maximize remote video"}
                      >
                        {isVideoMaximized ? <MdFullscreenExit /> : <MdFullscreen />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Col>

            <Col md={3} className="right-side-container">
              <CombinedPage
                users={users}
                messages={messages}
                currentUser={currentUser}
                startScreenSharing={startScreenSharing}
                stopScreenSharing={stopScreenSharing}
                isScreenSharing={isScreenSharing}
                onSendMessage={handleSendMessage}
                startRecording={startRecording}
                stopRecording={stopRecording}
                startLiveSpeaking={startLiveSpeaking}
                stopLiveSpeaking={stopLiveSpeaking}
                isRecording={isRecording}
                isLiveSpeaking={isLiveSpeaking}
                audioBlob={audioBlob}
                setAudioBlob={setAudioBlob}
                onSendAudioMessage={handleSendAudioMessage}
              />
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default DrawingPage;
