import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { Form, Button, Card } from "react-bootstrap";
import "../styles/JoinRoom.css";

const JoinRoom = ({ setUsername, setRoom }) => {
    const [name, setName] = useState("");
    const [room, setRoomName] = useState("");
    const navigate = useNavigate();
    const socket = useSocket();

    const handleJoin = () => {
        if (name && room) {
            setUsername(name);
            setRoom(room);
            localStorage.setItem("username", name);
            localStorage.setItem("room", room);
            socket.emit("joinRoom", { username: name, room });
            navigate("/draw");
        }
    };

    return (
        <div className="join-container"> 
            <Card className="join-card">
                <h2 className="text-center mb-4">🎨 Join Drawing Room</h2>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Control
                            type="text"
                            placeholder="Enter Your Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="input-field"
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Control
                            type="text"
                            placeholder="Enter Room Name"
                            value={room}
                            onChange={(e) => setRoomName(e.target.value)}
                            className="input-field"
                        />
                    </Form.Group>
                    <Button className="join-button" onClick={handleJoin}>
                        🚀 Join Room
                    </Button>
                </Form>
            </Card>
        </div>
    );
};

export default JoinRoom;
