import { createContext, useContext } from "react";
import { io } from "socket.io-client";

console.log("Socket",process.env.REACT_APP_SOCKET_URL);

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL;

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
