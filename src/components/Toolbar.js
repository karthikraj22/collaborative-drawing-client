import React from "react";
import { FaMinus, FaTrashAlt } from "react-icons/fa";
import { Tooltip } from "react-bootstrap";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
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

  // Helper to render icon button with tooltip
  const renderIconButton = (icon, label, onClick, extraProps = {}) => (
    <OverlayTrigger
      placement="right"
      overlay={<Tooltip id={`tooltip-${label}`}>{label}</Tooltip>}
    >
      <button
        className="toolbar-icon-btn"
        onClick={onClick}
        aria-label={label}
        {...extraProps}
      >
        {icon}
      </button>
    </OverlayTrigger>
  );

  return (
    <div className="toolbar-container">
      <OverlayTrigger
        placement="right"
        overlay={<Tooltip id="tooltip-brush-color">Brush Color</Tooltip>}
      >
        <input
          type="color"
          className="color-picker"
          onChange={(e) => setColor(e.target.value)}
          aria-label="Select brush color"
          title="Brush Color"
        />
      </OverlayTrigger>

      <OverlayTrigger
        placement="right"
        overlay={<Tooltip id="tooltip-brush-size">Brush Size</Tooltip>}
      >
        <input
          type="range"
          min="1"
          max="20"
          className="brush-slider"
          onChange={(e) => setBrushSize(parseInt(e.target.value))}
          aria-label="Adjust brush size"
          title="Brush Size"
        />
      </OverlayTrigger>

      {/* Clear Local Canvas */}
      {renderIconButton(<FaMinus />, "Clear My Canvas", clearLocalCanvas)}

      {/* Clear Global Canvas */}
      {renderIconButton(<FaTrashAlt />, "Clear for Everyone", clearGlobalCanvas)}
    </div>
  );
};

export default Toolbar;
