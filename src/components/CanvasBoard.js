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

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e) => {
    const { x, y } = getMousePos(e);
    setDrawing(true);
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(x, y);
  };

  const draw = (e) => {
    if (!drawing) return;
    const { x, y } = getMousePos(e);
    ctxRef.current.lineTo(x, y);
    ctxRef.current.stroke();

    if (socket) {
      socket.emit("draw", {
        x,
        y,
        color: brushColor,
        size: brushSize,
      });
    }
  };

  const stopDrawing = () => {
    setDrawing(false);
    ctxRef.current.closePath();
  };

  useEffect(() => {
    if (!socket) return;
  
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
  
    // Only set sizes once on mount
    const width = window.innerWidth * 0.85;
    const height = window.innerHeight * 0.75;
  
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = width;
    canvas.height = height;
  
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctxRef.current = ctx;
  
    socket.on("draw", ({ x, y, color, size }) => {
        const ctx = ctxRef.current;
      
        const prevColor = ctx.strokeStyle;
        const prevSize = ctx.lineWidth;
      
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
        ctx.lineTo(x, y);
        ctx.stroke();
      
        ctx.strokeStyle = prevColor;
        ctx.lineWidth = prevSize;
      });
      
  
    socket.on("resetCanvas", () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
  
    return () => {
      socket.off("draw");
      socket.off("resetCanvas");
    };
  }, [socket]);

 
useEffect(() => {
    if (ctxRef.current) {
      ctxRef.current.strokeStyle = brushColor;
      ctxRef.current.lineWidth = brushSize;
    }
  }, [brushColor, brushSize]);

  return (
    <div className="drawing-page">
  <div className="main-container">
    <Toolbar
      setColor={setBrushColor}
      setBrushSize={setBrushSize}
      canvasRef={canvasRef}
    />

    <div className="canvas-wrapper"> {/* NEW WRAPPER */}
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
</div>

  );
};

export default CanvasBoard;
