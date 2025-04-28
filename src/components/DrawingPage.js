// DrawingPage.js
import React, { useState, useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import { useNavigate } from "react-router-dom";
import CanvasBoard from "./CanvasBoard";
import UserList from "./UsersList";
import NavBar from "./Navbar";
import { Container, Row, Col } from "react-bootstrap";
import "../styles/DrawingPage.css";
import MessageInput from "./MessageInput";
import ChatBox from "./ChatBox";

const DrawingPage = ({ setUsername, setRoom }) => {
  const navigate = useNavigate();
  const socket = useSocket(); // Get socket instance
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState("");

  // State for managing audioBlob
  const [audioBlob, setAudioBlob] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isLiveSpeaking, setIsLiveSpeaking] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);

  const startRecording = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        setMediaStream(stream);
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (event) => {
          setAudioBlob(event.data);
        };
        mediaRecorder.onstop = () => {
          setIsRecording(false);
        };
        mediaRecorder.start();
        setIsRecording(true);
      } else {
        throw new Error('Audio recording is not supported by this browser.');
      }
    } catch (error) {
      console.error('Error starting audio recording:', error);
      alert('Error accessing microphone or audio recording is not supported.');
    }
  };

  const stopRecording = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop()); // Stop all tracks (microphone)
      setMediaStream(null);
      setIsRecording(false);
    }
  };

  const startLiveSpeaking = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        setMediaStream(stream);
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (event) => {
          socket.emit("liveAudio", { audio: event.data }); // Emit audio data to server
        };
        mediaRecorder.start(1000); // Capture audio every second
        setIsLiveSpeaking(true);
      } else {
        throw new Error('Audio recording is not supported by this browser.');
      }
    } catch (error) {
      console.error('Error accessing microphone for live speaking:', error);
      alert('Error accessing microphone for live speaking.');
    }
  };

  const stopLiveSpeaking = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setIsLiveSpeaking(false);
    }
  };

  const handleSendMessage = (message) => {
    console.log("Sending message:", message);
    if (message.trim()) {
      socket.emit("chatMessage", { message });
    }
  };

  const handleSendAudioMessage = (audioData) => {
    console.log("Sending audio:", audioData);
    socket.emit("audioMessage", { audio: audioData });
    stopRecording(); // Ensure the microphone stops after sending audio
  };

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    const storedRoom = localStorage.getItem("room");

    if (!storedUsername || !storedRoom) {
      navigate("/"); // Redirect if no username or room found
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
    
    socket.on("liveAudio", (audioData) => {
        console.log("Received live audio data:", audioData);
        
        // Check if audioData contains valid audio data
        if (audioData && audioData.audio) {
          // Convert the audio data into a proper Blob
          const audioBuffer = new Uint8Array(audioData.audio);  // Assuming the data is in a Uint8Array format
      
          // Create a Blob from the audioBuffer (ensure the correct MIME type)
          const audioBlob = new Blob([audioBuffer], { type: "audio/mpeg" }); // Change this to "audio/wav" if you know it's WAV
          console.log("Created Blob with type:", audioBlob.type);
          console.log("Blob size:", audioBlob.size);
          
          // Check if the Blob has data and size is not zero
          if (audioBlob.size > 0) {
            // Create a URL for the Blob to play
            const audioURL = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioURL);
      
            // Attempt to play the audio
            audio.play()
              .then(() => {
                console.log("Audio started playing");
              })
              .catch((error) => {
                console.error("Error playing audio:", error);
              });
      
            // Handle audio playback errors
            audio.onerror = (error) => {
              console.error("Error loading audio:", error);
            };
          } else {
            console.error("Received audio is empty or corrupted.");
          }
        } else {
          console.error("No valid audio data received.");
        }
      });
      
      
      
      

    return () => {
      socket.off("userList");
      socket.off("message");
    };
  }, [socket, navigate, setUsername, setRoom]);

  return (
    <div>
      <NavBar />
      <div className="drawing-page">
        <Container fluid>
          <Row className="align-items-start justify-content-between">
            <Col md={8} className="canvas-container">
              <CanvasBoard />
            </Col>

            <Col md={3} className="user-list-container">
              <UserList users={users} />
              <ChatBox messages={messages} currentUser={currentUser} />
              <MessageInput
                onSendMessage={handleSendMessage}
                onSendAudioMessage={handleSendAudioMessage}
                startRecording={startRecording}
                stopRecording={stopRecording}
                startLiveSpeaking={startLiveSpeaking}
                stopLiveSpeaking={stopLiveSpeaking}
                isRecording={isRecording}
                isLiveSpeaking={isLiveSpeaking}
                audioBlob={audioBlob}
                setAudioBlob={setAudioBlob}  // Pass setAudioBlob function to child
                setIsRecording={setIsRecording}  // Pass setIsRecording function to child
              />
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default DrawingPage;
