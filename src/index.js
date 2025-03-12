import React from "react";
import ReactDOM from "react-dom/client"; 
import App from "./App";
import { SocketProvider } from "./context/SocketContext";
import "bootstrap/dist/css/bootstrap.min.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <SocketProvider>
        <App />
    </SocketProvider>
);
npm 