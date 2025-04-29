import React, { useEffect, useRef, useState } from "react";
import { useSocket } from "../context/SocketContext";
import Toolbar from "./Toolbar"; 
import "../styles/DrawingPage.css";

const CanvasBoard = () => {
    const socket = useSocket();
    const canvasRef = useRef(null);
    const ctxRef = useRef(null);
    const [drawing, setDrawing] = useState(false);
    const [brushColor, setBrushColor] = useState("#000000"); 
    const [brushSize, setBrushSize] = useState(5); 

    useEffect(() => {
        if (!socket) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        canvas.width = window.innerWidth * 0.85;
        canvas.height = window.innerHeight * 0.75;

        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
        ctxRef.current = ctx;

        socket.on("draw", ({ x, y, color, size }) => {
            ctxRef.current.strokeStyle = color;
            ctxRef.current.lineWidth = size;
            ctxRef.current.lineTo(x, y);
            ctxRef.current.stroke();
        });

        socket.on("resetCanvas", () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        });

        return () => {
            socket.off("draw");
            socket.off("resetCanvas");
        };
    }, [socket, brushColor, brushSize]);

    useEffect(() => {
        if (ctxRef.current) {
            ctxRef.current.strokeStyle = brushColor;
            ctxRef.current.lineWidth = brushSize;
        }
    }, [brushColor, brushSize]);

    const startDrawing = (e) => {
        setDrawing(true);
        ctxRef.current.beginPath();
        ctxRef.current.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    };

    const draw = (e) => {
        if (!drawing) return;
        ctxRef.current.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        ctxRef.current.stroke();

        if (socket) {
            socket.emit("draw", {
                x: e.nativeEvent.offsetX,
                y: e.nativeEvent.offsetY,
                color: brushColor,
                size: brushSize,
            });
        }
    };

    const stopDrawing = () => {
        setDrawing(false);
        ctxRef.current.closePath();
    };

    return (
        <div className="drawing-page">
  <div className="main-container">
      <Toolbar setColor={setBrushColor} setBrushSize={setBrushSize} canvasRef={canvasRef} />

        <canvas
          ref={canvasRef}
          className="canvas-board"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
    </div>
</div>


    );
};

export default CanvasBoard;
