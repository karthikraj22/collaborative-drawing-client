import React, { useState, useEffect,useRef } from "react";
import { useSocket } from "../context/SocketContext";
import { useNavigate } from "react-router-dom";
import CanvasBoard from "./CanvasBoard";
import CombinedPage from "./Combined";
import NavBar from "./Navbar";
import { Container, Row, Col } from "react-bootstrap";
import "../styles/DrawingPage.css";

const DrawingPage = ({ setUsername, setRoom }) => {
  const navigate = useNavigate();
  const socket = useSocket();
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const [isMaximized, setIsMaximized] = useState(false);

  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isLiveSpeaking, setIsLiveSpeaking] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [screenShareStream, setScreenShareStream] = useState(null);
  const [screenSharingUser, setScreenSharingUser] = useState(null);
  const [videoStreams, setVideoStreams] = useState([]);
  const [iceCandidatesQueue, setIceCandidatesQueue] = useState([]);

  // Create PeerConnection with ICE candidates
  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }] // STUN server
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("sendIceCandidate", event.candidate);
      }
    };

    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      setVideoStreams((prevStreams) => [...prevStreams, remoteStream]);
    };

    handlePeerConnectionInitialization(pc);
    return pc;
  };

  // Handle peer connection initialization and process buffered ICE candidates
  const handlePeerConnectionInitialization = (pc) => {
    setPeerConnection(pc);

    if (iceCandidatesQueue.length > 0) {
      iceCandidatesQueue.forEach((candidate) => {
        const iceCandidate = new RTCIceCandidate(candidate);
        pc.addIceCandidate(iceCandidate).catch((error) => console.error("Failed to add ICE candidate:", error));
      });
      setIceCandidatesQueue([]); // Clear ice candidates queue after processing
    }
  };

  // Handle receiving ICE candidates
  const handleReceiveIceCandidate = async (data) => {
    if (!peerConnection || !peerConnection.remoteDescription) {
      setIceCandidatesQueue((prevQueue) => [...prevQueue, data.candidate]);
      return;
    }

    try {
      const candidate = new RTCIceCandidate(data);
      await peerConnection.addIceCandidate(candidate);
    } catch (err) {
      console.error("Error adding ICE candidate:", err);
    }
  };

  // Handle the offer from the other peer
  const handleReceiveOffer = async (offer) => {
    let pc = peerConnection;
    if (!pc) {
      pc = createPeerConnection();
      setPeerConnection(pc);
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", answer);
      setIsLiveSpeaking(true);
    } catch (error) {
      console.error("Error handling offer:", error);
    }
  };

  // Start live speaking (microphone stream)
  const startLiveSpeaking = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const pc = createPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("offer", offer);

      setPeerConnection(pc);
      setMediaStream(stream); 
      setIsLiveSpeaking(true); 
    } catch (error) {
      console.error("Error accessing microphone for live speaking:", error);
    }
  };

  // Stop live speaking (microphone stream)
  const stopLiveSpeaking = () => {
    if (mediaStream && isLiveSpeaking) {
      mediaStream.getTracks().forEach((track) => track.stop()); // Stop the microphone tracks
      setIsLiveSpeaking(false);
      setMediaStream(null);
      setPeerConnection(null);
      console.log("Live speaking stopped.");
    }
  };

  // Start screen sharing
  const startScreenSharing = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      console.log("✅ Obtained screen share stream:", stream);
  
      const pc = createPeerConnection();
  
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
        console.log(`➕ Added track to PeerConnection: ${track.kind}`);
      });
  
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log("📤 Created and set local SDP offer:", offer);
  
      socket.emit("offer", offer);
      console.log("🚀 Emitted 'offer' event to signaling server");
  
      setPeerConnection(pc);
      setScreenShareStream(stream);
      setIsScreenSharing(true);
      setScreenSharingUser(currentUser);
    } catch (error) {
      console.error("❌ Error accessing screen:", error);
    }
  };
  

  // Stop screen sharing
  const stopScreenSharing = () => {
    if (screenShareStream) {
      screenShareStream.getTracks().forEach((track) => track.stop());
      setIsScreenSharing(false);
      setScreenShareStream(null);
      setPeerConnection(null);
      setScreenSharingUser(null);
    }
  };

  // Assume 'socket' is available in your component scope

  const startRecording = () => {
    if (!isRecording) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          mediaStreamRef.current = stream;
          const mediaRecorder = new MediaRecorder(stream);
          const chunks = [];

          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              chunks.push(event.data);
            }
          };

          mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: "audio/webm" });
            setAudioBlob(blob);

            // Emit audio blob to server
            if (socket) {
              socket.emit("audioMessage", { audio: blob });
            }

            setIsRecording(false);

            // Stop all tracks
            mediaStreamRef.current.getTracks().forEach((track) => track.stop());
            mediaStreamRef.current = null;
            mediaRecorderRef.current = null;
          };

          mediaRecorder.start();
          mediaRecorderRef.current = mediaRecorder;
          setIsRecording(true);
        })
        .catch((error) => {
          console.error("Error starting recording:", error);
        });
    } else {
      console.log("Already recording.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };



  // Handle sending chat messages
  const handleSendMessage = (message) => {
    if (message.trim()) {
      socket.emit("chatMessage", { message });
    }
  };

  // Handle sending audio messages
  const handleSendAudioMessage = () => {
    if (audioBlob) {
      const reader = new FileReader();
      reader.onloadend = () => {
        socket.emit("audioMessage", { audio: reader.result });
        setAudioBlob(null); // Clear the audioBlob after sending
      };
      reader.readAsArrayBuffer(audioBlob);
    }
  };

  // Listen to socket events for ICE candidates and offers
  useEffect(() => {
    if (!socket) return;

    socket.on("receiveOffer", handleReceiveOffer);
    socket.on("receiveIceCandidate", handleReceiveIceCandidate);

    return () => {
      socket.off("receiveOffer", handleReceiveOffer);
      socket.off("receiveIceCandidate", handleReceiveIceCandidate);
    };
  }, [socket, peerConnection]);

  // Initialize the room and user details
  useEffect(() => {
    const storedUsername = sessionStorage.getItem("username");
    const storedRoom = sessionStorage.getItem("room");

    if (!storedUsername || !storedRoom) {
      navigate("/"); // Redirect to home page
      return;
    }

    setUsername(storedUsername);
    setRoom(storedRoom);
    setCurrentUser(storedUsername);

    socket.emit("joinRoom", { username: storedUsername, room: storedRoom });

    socket.on("userList", (userList) => {
      setUsers(userList);
    });

    socket.on("message", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socket.off("userList");
      socket.off("message");
    };
  }, [socket, navigate, setUsername, setRoom]);

  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && screenShareStream) {
      videoRef.current.srcObject = screenShareStream;
      videoRef.current.play().catch(() => {});
    }
  }, [screenShareStream]);



  return (
    <div>
      <NavBar />
      <div className="drawing-page">
        <Container fluid>
          <Row className="align-items-start justify-content-between">
            <Col md={isScreenSharing ? 8 : 6} className="canvas-container">
              <CanvasBoard />

              {isScreenSharing && screenShareStream && (
                    <div className={`screen-share-popup ${isMaximized ? "maximized" : ""}`}>
                    <video
                      ref={videoRef}
                      className="screen-share-video"
                      muted
                      autoPlay
                      playsInline
                    />
                    <button
                      className="toggle-maximize-btn"
                      onClick={() => setIsMaximized(!isMaximized)}
                      aria-label={isMaximized ? "Minimize screen share" : "Maximize screen share"}
                    >
                      {isMaximized ? "🗗" : "🗖"}
                    </button>
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
