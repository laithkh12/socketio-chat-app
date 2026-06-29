import cors from "cors";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import type { ChatMessage, OutgoingChatMessage } from "../types/chat";

const app = express();
const httpServer = createServer(app);
const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:3000";

app.use(cors({ origin: clientOrigin }));

const io = new Server(httpServer, {
  cors: {
    origin: clientOrigin,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("chat:message", (message: OutgoingChatMessage) => {
    const trimmedText = message.text.trim();
    const trimmedUsername = message.username.trim();

    if (!trimmedText || !trimmedUsername) {
      return;
    }

    const chatMessage: ChatMessage = {
      id: crypto.randomUUID(),
      username: trimmedUsername,
      text: trimmedText,
      createdAt: new Date().toISOString(),
    };

    io.emit("chat:message", chatMessage);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const port = Number(process.env.PORT ?? 3001);

httpServer.listen(port, () => {
  console.log(`Socket server running on http://localhost:${port}`);
});
