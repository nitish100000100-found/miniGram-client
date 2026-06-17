import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const connectSocket = () => {
    if (socket?.connected) return;

    if (socket) {
      socket.connect();
      return;
    }

    const newSocket = io(import.meta.env.VITE_API_URL, {
      withCredentials: true,
      autoConnect: true,
    });

    newSocket.on("getOnlineUsers", (users) => {
      setOnlineUsers(users);
    });

    setSocket(newSocket);
  };

  useEffect(() => {
    connectSocket();

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, connectSocket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};
