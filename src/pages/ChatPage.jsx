import React from "react";
import { useSocket } from "../context/SocketContext.jsx";

function ChatPage() {
  const { socket, onlineUsers } = useSocket();

  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", color: "#fff", backgroundColor: "#0c0720" }}>
      <h1>Coming Soon</h1>
      <p>Socket ID: {socket?.id || "Connecting/Disconnected"}</p>
      <p>Online Users Count: {onlineUsers?.length || 0}</p>
    </div>
  );
}

export default ChatPage;
