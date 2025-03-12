import React, { useState, useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import { useNavigate } from "react-router-dom";
import CanvasBoard from "./CanvasBoard";
// import Toolbar from "./Toolbar";
import UserList from "./UsersList";
import NavBar from "./Navbar"; 
import { Container, Row, Col } from "react-bootstrap";
import "../styles/DrawingPage.css";

const DrawingPage = ({ setUsername, setRoom }) => {
    const navigate = useNavigate();
    const socket = useSocket();
    const [users, setUsers] = useState([]);
 

    useEffect(() => {
        let storedUsername = localStorage.getItem("username");
        let storedRoom = localStorage.getItem("room");

        if (!storedUsername || !storedRoom) {
            navigate("/");
            return;
        }

        setUsername(storedUsername);
        setRoom(storedRoom);
        socket.emit("joinRoom", { username: storedUsername, room: storedRoom });

        socket.on("userList", (userList) => {
            setUsers(userList);
        });

        return () => socket.off("userList");
    }, [socket, navigate, setUsername, setRoom]);

    return (
        <div>
             <div>
              <NavBar />
        </div>
        <div className="drawing-page">
            
            <Container fluid>
                <Row className="align-items-start justify-content-between">
                    
              
                    <Col md={8} className="canvas-container">
                   
                        {/* <Toolbar setColor={setBrushColor} setBrushSize={setBrushSize} /> */}
                        <CanvasBoard  />
                    </Col>

                    <Col md={3} className="user-list-container">
                        <UserList users={users} />
                    </Col>

                </Row>
            </Container>
        </div>
        </div>
       
    );
};

export default DrawingPage;
