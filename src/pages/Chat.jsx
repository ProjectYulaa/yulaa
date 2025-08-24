// src/pages/Chat.jsx
import React, { useState, useEffect, useRef } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  addDoc,
  setDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  where,
} from "firebase/firestore";
import { getDatabase, ref, onValue } from "firebase/database";
import "../styles/Chat.css";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [expertOnline, setExpertOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const sessionStartTime = useRef(new Date());
  const currentUser = auth.currentUser;

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Expert presence (from Realtime DB)
  useEffect(() => {
    const rtdb = getDatabase();
    const presenceRef = ref(rtdb, "experts/online");
    onValue(presenceRef, (snapshot) => {
      setExpertOnline(snapshot.val() === true);
    });
  }, []);

  // Create chat doc if not exists + listen for messages
  useEffect(() => {
    if (!currentUser) return;

    const chatId = `customer_${currentUser.uid}_expert`;

    // Ensure chat document exists
    setDoc(
      doc(db, "chats", chatId),
      {
        customerId: currentUser.uid,
        customerName: currentUser.displayName || "Customer",
        participants: [currentUser.uid],
        status: "pending",
        assignedExpertId: "",
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
      },
      { merge: true }
    );

    // Listen for this chat's messages
    const q = query(
      collection(db, "chats", chatId, "messages"),
      where("timestamp", ">=", sessionStartTime.current),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(msgs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;

    const chatId = `customer_${currentUser.uid}_expert`;

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text: newMessage.trim(),
      senderId: currentUser.uid,
      senderName: currentUser.displayName || "Customer",
      timestamp: serverTimestamp(),
    });

    // update last message in chat doc
    await setDoc(
      doc(db, "chats", chatId),
      {
        lastMessage: newMessage.trim(),
        lastSender: "customer",
        lastUpdated: serverTimestamp(),
      },
      { merge: true }
    );

    setNewMessage("");
  };

  if (!currentUser) {
    return (
      <>
        <Header />
        <div className="chat-container">
          <p className="login-message">Please log in to start a chat.</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="chat-container">
        <header className="chat-header">
          <h2>Chat with Expert</h2>
          <div className={`expert-status ${expertOnline ? "online" : "offline"}`}>
            {expertOnline ? "Expert is Online" : "Expert is Offline"}
          </div>
        </header>

        <div className="chat-messages">
          {loading ? (
            <p className="loading">Loading chat...</p>
          ) : messages.length === 0 ? (
            <p className="no-messages">While you wait, we recommend you to send query on myyulaa@gmail.com for faster response.</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-bubble ${
                  msg.senderId === currentUser.uid ? "customer" : "expert"
                }`}
              >
                <span className="sender">{msg.senderName}</span>
                <p>{msg.text}</p>
                <small>
                  {msg.timestamp?.toDate
                    ? msg.timestamp
                        .toDate()
                        .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : ""}
                </small>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input">
          <input
            type="text"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
      <Footer />
    </>
  );
}
