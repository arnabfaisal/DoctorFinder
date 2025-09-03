import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const CHAT_POLL_INTERVAL = 10000;

function DoctorU() {
  const { tokens, user } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // Slots
  const [slots, setSlots] = useState([]);
  const [centres, setCentres] = useState([]);
  const [centreId, setCentreId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [cost, setCost] = useState("");

  const ws = useRef(null);
  const messagesEndRef = useRef(null);
  const pollingRef = useRef(null);
  const navigate = useNavigate();

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current)
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch all chats
  const fetchChats = async () => {
    if (!tokens) return;
    try {
      const res = await fetch("http://localhost:3000/api/chat/my-chats", { // last message from the patient
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });
      const data = await res.json();
      setChats(data);
      console.log(chats);
    } catch (err) {
      console.error("Failed to fetch chats", err);
    }
  };

  // Fetch slots
  const fetchSlots = async () => {
    if (!tokens) return;
    try {
      const res = await fetch("http://localhost:3000/api/slots/doctor/bookings", {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });
      const data = await res.json();
      setSlots(data);
    } catch (err) {
      console.error("Failed to fetch slots", err);
    }
  };

  // Fetch centres
  const fetchCentres = async () => {
    if (!tokens) return;
    try {
      const res = await fetch("http://localhost:3000/api/centre", {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });
      const data = await res.json();
      setCentres(data.centre || []);
      console.log(data)
    } catch (err) {
      console.error("Failed to fetch centres", err);
    }
  };

  // Create slot
  const handleCreateSlot = async (e) => {
    e.preventDefault();
    if (!centreId || !startTime || !endTime || !cost) {
      alert("All fields required!");
      return;
    }
    try {
      const res = await fetch("http://localhost:3000/api/slots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({
          centre_id: centreId,
          start_time: startTime,
          end_time: endTime,
          cost,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCentreId("");
        setStartTime("");
        setEndTime("");
        setCost("");
        fetchSlots();
      } else {
        alert(data.message || "Failed to create slot");
      }
    } catch (err) {
      console.error("Failed to create slot", err);
    }
  };

  // Polling
  useEffect(() => {
    if (!tokens) return;
    pollingRef.current = setInterval(() => {
      fetchChats();
      fetchSlots();
    }, CHAT_POLL_INTERVAL);
    return () => {
      clearInterval(pollingRef.current);
    };
  }, [tokens]);

  // WebSocket setup
  useEffect(() => {
    if (!tokens) return;
    fetchChats();
    fetchSlots();
    fetchCentres();

    ws.current = new WebSocket("ws://localhost:3000");
    ws.current.onopen = () => {
      ws.current.send(
        JSON.stringify({ type: "auth", user_id: user.user_id })
      );
      console.log("✅ Doctor connected to WS");
    };

    ws.current.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (selectedChat && msg.chat_id === selectedChat.chat_id) {
        setMessages((prev) => [...prev, msg]);
      }

      if (msg.type === "chat") {
        setChats((prev) =>
          prev.map((c) =>
            c.chat_id === msg.chat_id
              ? { ...c, last_message: msg.content }
              : c
          )
        );
      }

      if (msg.type === "new_chat") {
        setChats((prev) => {
          const exists = prev.some((c) => c.chat_id === msg.chat.chat_id);
          return exists ? prev : [...prev, msg.chat];
        });
      }
    };

    ws.current.onclose = () => console.log("❌ Disconnected from WS");
    return () => {
      ws.current?.close();
    };
  }, [tokens, user, selectedChat]);

  // Select chat
  const selectChat = async (chat) => {
    setSelectedChat(chat);
    try {
      const res = await fetch(
        `http://localhost:3000/api/chat/${chat.chat_id}/messages`,
        {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        }
      );
      const data = await res.json();
      setMessages(data || []);
    } catch (err) {
      console.error("Failed to fetch chat messages", err);
    }
  };

  // Send message
  const sendMessage = (e) => {
    e.preventDefault();
    if (
      !newMessage.trim() ||
      !selectedChat ||
      ws.current.readyState !== WebSocket.OPEN
    )
      return;
    ws.current.send(
      JSON.stringify({
        type: "chat",
        chat_id: selectedChat.chat_id,
        sender_id: user.user_id,
        sender_role: user.account_type,
        recipient_id:
          selectedChat.patient_id === user.user_id
            ? selectedChat.doctor_id
            : selectedChat.patient_id,
        content: newMessage,
      })
    );
    setMessages((prev) => [
      ...prev,
      { chat_id: selectedChat.chat_id, sender_id: user.user_id, content: newMessage },
    ]);
    setNewMessage("");
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-1/5 border-r p-3 bg-gray-50 text-sm overflow-y-auto">
        <h2 className="font-semibold mb-3">Patients</h2>
        <div className="space-y-2">
          {chats.map((chat) => (
            <div
              key={chat.chat_id}
              className={`p-2 cursor-pointer rounded ${
                selectedChat?.chat_id === chat.chat_id
                  ? "bg-blue-100"
                  : "bg-white"
              }`}
              onClick={() => selectChat(chat)}
            >
              <p className="text-xs font-medium">Patient {chat.patient_id}</p>
              <p className="text-[11px] text-gray-500 truncate">
                {chat.last_message || "No messages yet"}
              </p>
            </div>
          ))}
        </div>

        {/* Slots */}
        <div className="mt-6">
          <h2 className="font-semibold mb-2">My Slots</h2>
          <form onSubmit={handleCreateSlot} className="space-y-2">
            <select
              value={centreId}
              onChange={(e) => setCentreId(e.target.value)}
              className="w-full border rounded p-1 text-xs"
              required
            >
              <option value="">Select Centre</option>
              {centres.map((c) => (
                <option key={c.centre_id} value={c.centre_id}>
                  {c.Name}
                </option>
              ))}
            </select>

            <input
              type="datetime-local"
              className="w-full border rounded p-1 text-xs"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />

            <input
              type="datetime-local"
              className="w-full border rounded p-1 text-xs"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />

            <input
              type="number"
              placeholder="Cost"
              className="w-full border rounded p-1 text-xs"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              required
            />

            <button
              type="submit"
              className="w-full px-2 py-1 bg-green-500 text-white text-xs rounded"
            >
              Create Slot
            </button>
          </form>

          <ul className="mt-3 space-y-1 text-xs">
            {slots.map((slot, idx) => (
              <li key={idx} className="p-1 border rounded bg-white">
                Booking ID {slot.booking_id} <br />
                Centre {slot.centre_name} <br/>
                Start {slot.start_time.slice(0, 16)} <br/>
                End {slot.end_time.slice(0, 16)} <br />
                Name {slot.patient_first_name} <br/>
                Email {slot.patient_email} <br/>
                Cost: ${slot.cost}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col p-3 text-sm">
        {selectedChat ? (
          <>
            <h2 className="font-semibold text-base mb-2">
              Chat with Patient {selectedChat.patient_id}
            </h2>
            <div className="flex-1 border rounded p-3 overflow-y-auto bg-white">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`mb-2 flex ${
                    msg.sender_id === user.user_id
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <p
                    className={`px-2 py-1 rounded-lg text-xs ${
                      msg.sender_id === user.user_id
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {msg.content}
                  </p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className="mt-2 flex">
              <input
                type="text"
                className="flex-1 border rounded p-2 text-xs"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button
                type="submit"
                className="ml-2 px-3 py-1 bg-green-600 text-white text-xs rounded"
              >
                Send
              </button>
            </form>
          </>
        ) : (
          <p className="text-gray-500">Select a patient to start chatting</p>
        )}
      </div>
    </div>
  );
}

export default DoctorU;


