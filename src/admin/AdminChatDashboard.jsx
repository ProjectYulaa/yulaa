// src/pages/AdminChatDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { auth, db, rtdb } from "../firebase";
import {
  collection,
  doc,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  where,
  serverTimestamp,
  runTransaction,
  updateDoc,
  limit,
} from "firebase/firestore";
import { ref, onDisconnect, set as rtdbSet } from "firebase/database";
import "../styles/AdminChatDashboard.css";

export default function AdminChatDashboard() {
  const [expert, setExpert] = useState(null);
  const [waitingChats, setWaitingChats] = useState([]);
  const [myActiveChats, setMyActiveChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
const [selectedWaitingId, setSelectedWaitingId] = useState("");

  // --- AUTH + PRESENCE ---
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      setExpert(u);
      if (u) {
        const onlineRef = ref(rtdb, `experts/${u.uid}/online`);
        await rtdbSet(onlineRef, true);
        onDisconnect(onlineRef).set(false);
      }
    });
    return () => unsub();
  }, []);

  // --- SUBSCRIBE: Waiting chats ---
  useEffect(() => {
    const qWaiting = query(
      collection(db, "chats"),
      where("status", "==", "pending"),
      where("assignedExpertId", "==", ""),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(qWaiting, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setWaitingChats(items);
    });
    return () => unsub();
  }, []);

  // --- SUBSCRIBE: My active chats ---
  useEffect(() => {
    if (!expert) return;
    const qMine = query(
      collection(db, "chats"),
      where("assignedExpertId", "==", expert.uid),
      where("status", "in", ["active", "pending"]),
      orderBy("lastUpdated", "desc"),
      limit(25)
    );
    const unsub = onSnapshot(qMine, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMyActiveChats(items);
      if (!selectedChatId && items.length) {
        setSelectedChatId(items[0].id);
      }
    });
    return () => unsub();
  }, [expert]);

  // --- SUBSCRIBE: Messages for selected chat ---
  useEffect(() => {
    if (!selectedChatId) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    const qMsgs = query(
      collection(db, "chats", selectedChatId, "messages"),
      orderBy("timestamp", "asc")
    );
    const unsub = onSnapshot(qMsgs, (snap) => {
      const m = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMessages(m);
      setLoadingMessages(false);
    });
    return () => unsub();
  }, [selectedChatId]);

  // --- Helpers ---
  const formatWait = (createdAt) => {
    if (!createdAt) return "—";
    const ms = Date.now() - createdAt.toMillis();
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return "<1 min";
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ${mins % 60}m`;
  };

  const waitingCount = waitingChats.length;

  const averageWait = useMemo(() => {
    if (!waitingChats.length) return "0 min";
    const total = waitingChats.reduce((acc, c) => {
      if (!c.createdAt) return acc;
      return acc + (Date.now() - c.createdAt.toMillis());
    }, 0);
    const avgMs = total / waitingChats.length;
    const mins = Math.floor(avgMs / 60000);
    return mins < 1 ? "<1 min" : `${mins} min`;
  }, [waitingChats]);

  // --- Claim a chat safely ---
 const claimChat = async (chatId) => {
  if (!expert) return;
  const chatRef = doc(db, "chats", chatId);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(chatRef);
    if (!snap.exists()) throw new Error("Chat does not exist");
    const data = snap.data();

    if (data.assignedExpertId) {
      throw new Error("Already claimed");
    }

    transaction.update(chatRef, {
      assignedExpertId: expert.uid,
      status: "active",
      assignedAt: serverTimestamp(),
      participants: Array.from(
        new Set([...(data.participants || []), expert.uid])
      ),
      lastUpdated: serverTimestamp(), // 👈 critical for query orderBy
    });
  });

  // Immediately show the chat, without waiting for Firestore snapshot
  setSelectedChatId(chatId);
  setSelectedWaitingId(""); 
};


  // --- Send message ---
// --- Send message ---
const sendMessage = async () => {
  if (!expert || !selectedChatId || !input.trim()) return;

  const msg = {
    text: input.trim(),
    senderId: expert.uid,
    senderName: expert.displayName || "Expert",
    timestamp: serverTimestamp(),
  };

  // Save message to subcollection
  await addDoc(collection(db, "chats", selectedChatId, "messages"), msg);

  // Update parent chat doc
  await updateDoc(doc(db, "chats", selectedChatId), {
    lastMessage: msg.text,
    lastSender: "expert",
    lastUpdated: serverTimestamp(),
  });

  setInput("");
};


  const closeChat = async () => {
    if (!selectedChatId) return;
    await updateDoc(doc(db, "chats", selectedChatId), {
      status: "closed",
      lastUpdated: serverTimestamp(),
    });
  };

  // --- UI ---
  return (
    <div className="admin-chat-dashboard">
      <header className="acd-header">
        <h1>Expert Live Chat</h1>
        <div className="acd-stats">
          <div className="stat">
            <span className="label">Waiting</span>
            <span className="value">{waitingCount}</span>
          </div>
          <div className="stat">
            <span className="label">Avg wait</span>
            <span className="value">{averageWait}</span>
          </div>
        </div>
      </header>

      <div className="acd-body">
        {/* Sidebar */}
        <aside className="acd-sidebar">
          <div className="section">
            <h3>Waiting Queue ({waitingCount})</h3>
      
<select
  className="acd-select"
  size={Math.min(8, Math.max(3, waitingChats.length))}
  onChange={(e) => setSelectedWaitingId(e.target.value)}
  value={selectedWaitingId}
>
  {waitingChats.map((c) => (
    <option key={c.id} value={c.id}>
      {c.customerName || c.customerId || c.id.slice(0, 8)} · {formatWait(c.createdAt)}
    </option>
  ))}
</select>

<button
  className="btn"
  disabled={!selectedWaitingId}
  onClick={() => claimChat(selectedWaitingId)}
>
  Claim & Open
</button>
          </div>

          <div className="section">
            <h3>My Active Chats</h3>
            <ul className="acd-list">
              {myActiveChats.map((c) => (
                <li
                  key={c.id}
                  className={`acd-list-item ${
                    selectedChatId === c.id ? "active" : ""
                  }`}
                  onClick={() => setSelectedChatId(c.id)}
                >
                  <div className="title">
                    {c.customerName || c.customerId || c.id.slice(0, 8)}
                  </div>
                  <div className="subtitle">{c.lastMessage || "—"}</div>
                </li>
              ))}
              {myActiveChats.length === 0 && (
                <li className="muted">No active chats</li>
              )}
            </ul>
          </div>
        </aside>

        {/* Chat panel */}
        <main className="acd-chat">
          {!selectedChatId ? (
            <div className="placeholder">Select a chat from the left</div>
          ) : (
            <div className="chat-wrapper">
              <div className="chat-header">
                <div className="chat-title">
                  {(() => {
                    const all = [...waitingChats, ...myActiveChats];
                    const found = all.find((x) => x.id === selectedChatId);
                    return found
                      ? found.customerName ||
                          found.customerId ||
                          selectedChatId
                      : selectedChatId;
                  })()}
                </div>
                <div className="chat-actions">
                  <button className="btn btn-danger" onClick={closeChat}>
                    Close
                  </button>
                </div>
              </div>

              <div className="messages">
                {loadingMessages && (
                  <div className="muted">Loading messages…</div>
                )}
                {!loadingMessages && messages.length === 0 && (
                  <div className="muted">No messages yet</div>
                )}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`bubble ${
                      m.senderId === expert?.uid ? "me" : "them"
                    }`}
                  >
                    <div className="meta">
                      <span className="name">{m.senderName}</span>
                      <span className="time">
                        {m.timestamp?.toDate
                          ? m.timestamp
                              .toDate()
                              .toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                          : ""}
                      </span>
                    </div>
                    <div className="text">{m.text}</div>
                  </div>
                ))}
              </div>

              <div className="input-row">
                <input
                  type="text"
                  placeholder="Type your reply…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <button className="btn" onClick={sendMessage}>
                  Send
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
