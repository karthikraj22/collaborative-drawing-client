import { createContext, useContext } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "http://10.100.25.61:5000";

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
