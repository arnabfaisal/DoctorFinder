import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function ChatPage() {
  const { doctor_id } = useParams();
  const { tokens, user } = useAuth();

  // ✅ Hooks must always be called
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatId, setChatId] = useState(null);
  const ws = useRef(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (!tokens || !user) return;

    async function initChat() {
      try {
        // Create or fetch chat
        const res = await fetch("http://localhost:3000/api/chat/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens.accessToken}`,
          },
          body: JSON.stringify({
            doctor_id,
            patient_id: user.user_id,
          }),
        });
        const data = await res.json();
        const id = data.chat?.chat_id || data.chat_id;
        setChatId(id);

        // Fetch previous messages
        const msgRes = await fetch(`http://localhost:3000/api/chat/${id}/messages`, {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        });
        const msgData = await msgRes.json();
        setMessages(msgData || []);
      } catch (err) {
        console.error("Error initializing chat:", err);
      }
    }

    initChat();

    // WebSocket connection
    ws.current = new WebSocket("ws://localhost:3000");

    ws.current.onopen = () => {
      console.log("✅ Connected to chat WebSocket");
      ws.current.send(JSON.stringify({ type: "auth", user_id: user.user_id }));
    };

    ws.current.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.chat_id === chatId) setMessages((prev) => [...prev, msg]);
    };

    ws.current.onclose = () => console.log("❌ Disconnected from WebSocket");

    return () => ws.current?.close();
  }, [doctor_id, tokens, user, chatId]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || ws.current.readyState !== WebSocket.OPEN || !chatId) return;

    ws.current.send(JSON.stringify({
      type: "chat",
      chat_id: chatId,
      sender_id: user.user_id,
      sender_role: user.account_type,
      recipient_id: doctor_id,
      content: newMessage,
    }));

    setMessages((prev) => [...prev, { chat_id: chatId, sender_id: user.user_id, content: newMessage }]);
    setNewMessage("");
  };

  // ✅ Conditional rendering here, after hooks
  if (!tokens || !user) return <div>Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col p-6 bg-gray-50">
      <div className="container mx-auto max-w-2xl">
        <h2 className="text-2xl font-bold mb-4">Chat with Doctor</h2>

        <div className="flex-1 border rounded-lg p-4 overflow-y-auto bg-white">
          {messages.map((msg, idx) => (
            <div key={idx} className={`mb-2 flex ${msg.sender_id === user.user_id ? "justify-end" : "justify-start"}`}>
              <p className={`inline-block px-3 py-1 rounded-lg ${msg.sender_id === user.user_id ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}>
                {msg.content}
              </p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="mt-4 flex">
          <input
            type="text"
            className="flex-1 border rounded-lg p-2 focus:outline-none"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button type="submit" className="ml-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Send
          </button>
        </form>
      </div>
      </div>

  );
}

export default ChatPage;


