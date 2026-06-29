"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { ChatMessage } from "@/types/chat";
import styles from "./Chat.module.css";

const socketUrl =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3001";

export default function Chat() {
  const [username, setUsername] = useState("");
  const [joinedName, setJoinedName] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!joinedName) {
      return;
    }

    const socket = io(socketUrl);
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("chat:message", (message: ChatMessage) => {
      setMessages((current) => [...current, message]);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [joinedName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = username.trim();
    if (!trimmedName) {
      return;
    }
    setJoinedName(trimmedName);
  }

  function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedText = draft.trim();
    if (!trimmedText || !socketRef.current || !joinedName) {
      return;
    }

    socketRef.current.emit("chat:message", {
      username: joinedName,
      text: trimmedText,
    });
    setDraft("");
  }

  if (!joinedName) {
    return (
      <div className={styles.container}>
        <section className={styles.card}>
          <h1 className={styles.title}>Socket.io Chat</h1>
          <p className={styles.subtitle}>Enter a username to join the room.</p>
          <form className={styles.form} onSubmit={handleJoin}>
            <input
              className={styles.input}
              type="text"
              placeholder="Your name"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              maxLength={32}
              autoFocus
            />
            <button className={styles.button} type="submit">
              Join chat
            </button>
          </form>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <section className={styles.chat}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Socket.io Chat</h1>
            <p className={styles.subtitle}>
              Signed in as <strong>{joinedName}</strong>
            </p>
          </div>
          <span
            className={`${styles.status} ${
              connected ? styles.statusOnline : styles.statusOffline
            }`}
          >
            {connected ? "Connected" : "Disconnected"}
          </span>
        </header>

        <ul className={styles.messages}>
          {messages.length === 0 ? (
            <li className={styles.empty}>No messages yet. Say hello.</li>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.username === joinedName;

              return (
                <li
                  key={message.id}
                  className={`${styles.message} ${
                    isOwnMessage ? styles.messageOwn : ""
                  }`}
                >
                  <div className={styles.messageMeta}>
                    <span className={styles.messageAuthor}>
                      {message.username}
                    </span>
                    <time className={styles.messageTime}>
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                  <p className={styles.messageText}>{message.text}</p>
                </li>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </ul>

        <form className={styles.form} onSubmit={handleSend}>
          <input
            className={styles.input}
            type="text"
            placeholder="Type a message..."
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={500}
            disabled={!connected}
          />
          <button
            className={styles.button}
            type="submit"
            disabled={!connected || !draft.trim()}
          >
            Send
          </button>
        </form>
      </section>
    </div>
  );
}
