import React, { useState, useEffect, useRef } from "react";
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
  const videoRefs = useRef([]); // Create a ref to store video elements

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


  const [isVideoMaximized, setIsVideoMaximized] = useState(false);

const toggleVideoSize = () => {
  setIsVideoMaximized(!isVideoMaximized);
};


  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("sendIceCandidate", event.candidate);
      }
    };

    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      console.log("✅ Received remote stream:", remoteStream);

      if (!remoteStream.getVideoTracks().length) {
        console.error("❌ No video tracks found in the remote stream.");
      } else {
        console.log("🎥 Video tracks in remote stream:", remoteStream.getVideoTracks());
      }

      setVideoStreams((prevStreams) => {
        if (!prevStreams.some((stream) => stream.id === remoteStream.id)) {
          console.log("➕ Adding new remote stream to videoStreams");
          return [...prevStreams, remoteStream];
        }
        return prevStreams;
      });
    };
    
    handlePeerConnectionInitialization(pc);
    return pc;
  };

  const handlePeerConnectionInitialization = (pc) => {
    setPeerConnection(pc);

    if (iceCandidatesQueue.length > 0) {
      iceCandidatesQueue.forEach((candidate) => {
        const iceCandidate = new RTCIceCandidate(candidate);
        pc.addIceCandidate(iceCandidate).catch((error) => console.error("Failed to add ICE candidate:", error));
      });
      setIceCandidatesQueue([]); 
    }
  };

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

  const handleReceiveOffer = async (offer) => {
    let pc = peerConnection;
    if (!pc) {
      pc = createPeerConnection();
      setPeerConnection(pc);
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", answer);
      console.log("📥 Received offer, created and sent answer");

    } catch (error) {
      console.error("❌ Error handling received offer:", error);
    }
  };

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
      setIsLiveSpeaking(true); // Only update live speaking state
    } catch (error) {
      console.error("Error accessing microphone for live speaking:", error);
    }
  };

  const stopLiveSpeaking = () => {
    if (mediaStream && isLiveSpeaking) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setIsLiveSpeaking(false);
      setMediaStream(null);
      setPeerConnection(null);
      console.log("Live speaking stopped.");
    }
  };

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
      socket.emit("sendOffer", offer);

      setPeerConnection(pc);
      setScreenShareStream(stream);
      setIsScreenSharing(true); // Only update screen sharing state
      setScreenSharingUser(currentUser);
    } catch (error) {
      console.error("❌ Error accessing screen:", error);
    }
  };

  const stopScreenSharing = () => {
    if (screenShareStream) {
      screenShareStream.getTracks().forEach((track) => track.stop());
      setIsScreenSharing(false);
      setScreenShareStream(null);
      setPeerConnection(null);
      setScreenSharingUser(null);
    }
  };

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

  const handleSendMessage = (message) => {
    if (message.trim()) {
      socket.emit("chatMessage", { message });
    }
  };

  const handleSendAudioMessage = () => {
    if (audioBlob) {
      const reader = new FileReader();
      reader.onloadend = () => {
        socket.emit("audioMessage", { audio: reader.result });
        setAudioBlob(null); 
      };
      reader.readAsArrayBuffer(audioBlob);
    }
  };

  const handleAnswer = async (answer) => {
    if (!peerConnection) return;
    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      console.log("✅ Received and set remote answer");
    } catch (err) {
      console.error("❌ Error setting remote answer:", err);
    }
  };

  useEffect(() => {
    if (!socket) return;

    socket.on("receiveOffer", handleReceiveOffer);
    socket.on("receiveIceCandidate", handleReceiveIceCandidate);
    socket.on("answer", handleAnswer);

    return () => {
      socket.off("receiveOffer", handleReceiveOffer);
      socket.off("receiveIceCandidate", handleReceiveIceCandidate);
      socket.off("answer");
    };
  }, [socket, peerConnection]);

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

  useEffect(() => {
    console.log("Current videoStreams:", videoStreams);

    videoStreams.forEach((stream, index) => {
      const videoElement = document.getElementById(`remote-video-${index}`);
      if (videoElement) {
        if (videoElement.srcObject !== stream) {
          console.log(`Setting stream for video ${index}`);
          videoElement.srcObject = stream;

          const playPromise = videoElement.play();
          if (playPromise !== undefined) {
            playPromise.catch((err) => {
              console.error("Autoplay blocked. Attempting to play manually:", err);
              videoElement.muted = true; // Ensure it's muted for autoplay
              videoElement.play();
            });
          }
        }
      } else {
        console.error(`Video element with id remote-video-${index} not found`);
      }
    });
  }, [videoStreams]);

  useEffect(() => {
    videoStreams.forEach((stream, index) => {
      const videoElement = document.getElementById(`remote-video-${index}`);
      if (!videoElement) {
        console.error(`Video element with id remote-video-${index} not found.`);
      }
    });
  }, [videoStreams]);
    
  console.log("PeerConnection state:", peerConnection?.connectionState);


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

{!isScreenSharing && videoStreams.length > 0 && (
  <div className="remote-videos">
    {videoStreams.map((stream, index) => (
      <video
        key={index}
        id={`remote-video-${index}`}
        className={`remote-video ${isVideoMaximized ? 'maximized' : 'floating-video'}`}
        autoPlay
        playsInline
        muted
        ref={(video) => {
          if (video && stream) {
            console.log("stream", stream);

            // Only set srcObject if it's not already set
            if (video.srcObject !== stream) {
              video.srcObject = stream;
              video.play().catch((err) => {
                console.error("Error playing video:", err);
              });
            }
          }
        }}
        onClick={toggleVideoSize}
        style={{
          width: isVideoMaximized ? "80vw" : "300px", // Dynamically resize
          height: isVideoMaximized ? "80vh" : "200px", // Dynamically resize
          position: "fixed",
          bottom: 10,
          left: 10 + index * 310,
        }}
      />
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
