import { createContext, useContext } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "https://collaborative-drawing-app-server-j84z.onrender.com";

export const socket = io(SOCKET_URL, {
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 5, 
    reconnectionDelay: 3000,
});

const SocketContext = createContext(socket);

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
);
