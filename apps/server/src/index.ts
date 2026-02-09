import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { 
  ClientToServerEvents, 
  ServerToClientEvents, 
  InterServerEvents, 
  SocketData,
  Token
} from '@thecompany/shared-types';

const app = express();
const httpServer = createServer(app);

const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Simple in-memory state
let tokens: Token[] = [
  { id: 'token-1', x: 100, y: 100, color: 'red' },
  { id: 'token-2', x: 200, y: 200, color: 'blue' },
];

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST']
  }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("ping", () => {
      console.log("Ping received from " + socket.id);
      socket.emit("pong", "Pong from server!");
  });

  socket.on("state:request", () => {
    socket.emit("state:full", tokens);
  });

  socket.on("token:move", (updatedToken) => {
    // Update local state
    tokens = tokens.map(t => t.id === updatedToken.id ? updatedToken : t);
    
    // Broadcast to everyone else (or everyone including sender to confirm)
    // Broadcasting to everyone including sender allows "server-authoritative" correction if needed,
    // but for now, sender already did optimistic update. Let's broadcast to others.
    socket.broadcast.emit("token:moved", updatedToken);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
