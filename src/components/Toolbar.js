import React from "react";
import { useSocket } from "../context/SocketContext";
import "../styles/DrawingPage.css";

const Toolbar = ({ setColor, setBrushSize, canvasRef }) => {
    const socket = useSocket();

    const clearLocalCanvas = () => {
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d");
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
    };

  
    const clearGlobalCanvas = () => {
        socket.emit("resetCanvas"); 
    };

    return (
        <div className="toolbar-container">
            <div className="tool-item">
                <label className="tool-label">Brush Color</label>
                <input
                    type="color"
                    className="color-picker"
                    onChange={(e) => setColor(e.target.value)}
                />
            </div>

            <div className="tool-item">
                <label className="tool-label">Brush Size</label>
                <input
                    type="range"
                    min="1"
                    max="20"
                    className="brush-slider"
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                />
            </div>

            <div className="canvas-buttons">
                <button className="clear-btn local" onClick={clearLocalCanvas}>
                    🧹 Clear My Canvas
                </button>
                <button className="clear-btn global" onClick={clearGlobalCanvas}>
                    🚀 Clear for Everyone
                </button>
            </div>
        </div>
    );
};

export default Toolbar;
