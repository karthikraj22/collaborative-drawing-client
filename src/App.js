import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import JoinRoom from "./components/JoinRoom";
import DrawingPage from "./components/DrawingPage";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
    const [username, setUsername] = useState(sessionStorage.getItem("username") || "");
    const [room, setRoom] = useState(sessionStorage.getItem("room") || "");

    return (
        <Router>
            <Routes>
                <Route path="/" element={<JoinRoom setUsername={setUsername} setRoom={setRoom} />} />
                <Route path="/draw" element={<DrawingPage setUsername={setUsername} setRoom={setRoom} />} />
            </Routes>
        </Router>
    );
}

export default App;
