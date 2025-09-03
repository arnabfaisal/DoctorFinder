import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const CHAT_POLL_INTERVAL = 1000;

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
        alert(data.message || "Succesfully created slot");

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
!tokens ? (<div>not authorized </div>): (<div className="min-h-screen bg-gray-100 p-4">
  <div className="grid grid-cols-12 gap-4">

    {/* LEFT: Conversations + Booked Slots */}
    <div className="col-span-12 md:col-span-3 space-y-4">
      {/* Conversations (select chat) */}
      <div className="bg-white border rounded-lg shadow-sm p-4 flex flex-col">
        <h2 className="font-semibold text-gray-700 mb-3">Conversations</h2>
        <div className="space-y-2 overflow-y-auto max-h-[40vh]">
          {chats.map((chat) => (
            <div
              key={chat.chat_id}
              className={`p-3 cursor-pointer rounded-lg transition ${
                selectedChat?.chat_id === chat.chat_id
                  ? "bg-blue-100 border border-blue-300"
                  : "bg-gray-50 hover:bg-gray-100"
              }`}
              onClick={() => selectChat(chat)}
            >
              <p className="text-sm font-medium">
                {chat.patient_first_name} {chat.patient_last_name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {chat.last_message || "No messages yet"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Booked Slots */}
      <div className="bg-white border rounded-lg shadow-sm p-4 flex flex-col">
        <h2 className="font-semibold text-gray-700 mb-3">Booked Slots</h2>
        <ul className="space-y-2 text-xs overflow-y-auto max-h-[40vh]">
          {slots.map((slot, idx) => (
            <li key={idx} className="p-2 border rounded bg-gray-50">
              <p><span className="font-medium">Booking ID:</span> {slot.booking_id}</p>
              <p><span className="font-medium">Centre:</span> {slot.centre_name}</p>
              <p><span className="font-medium">Start:</span> {slot.start_time.slice(0, 16)}</p>
              <p><span className="font-medium">End:</span> {slot.end_time.slice(0, 16)}</p>
              <p><span className="font-medium">Patient:</span> {slot.patient_first_name}</p>
              <p><span className="font-medium">Email:</span> {slot.patient_email}</p>
              <p><span className="font-medium">Cost:</span> ${slot.cost}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>

    {/* MIDDLE: Chat Window (UNCHANGED) */}
    <div className="col-span-12 md:col-span-6">
      <div className="flex-1 flex flex-col p-3 text-sm bg-transparent">
        {selectedChat ? (
          <>
            <h2 className="font-semibold text-base mb-2">
              Chat with {selectedChat.patient_first_name}
            </h2>
            <div className="flex-1 border rounded p-3 overflow-y-auto bg-white">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`mb-2 flex ${
                    msg.sender_id === user.user_id ? "justify-end" : "justify-start"
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

    {/* RIGHT: Create Slot */}
    <div className="col-span-12 md:col-span-3 bg-white border rounded-lg shadow-sm p-4 flex flex-col">
      <h2 className="font-semibold text-gray-700 mb-3">Create Slot</h2>
      <form onSubmit={handleCreateSlot} className="space-y-3 text-xs">
        <select
          value={centreId}
          onChange={(e) => setCentreId(e.target.value)}
          className="w-full border rounded p-2"
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
          className="w-full border rounded p-2"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          required
        />

        <input
          type="datetime-local"
          className="w-full border rounded p-2"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          required
        />

        <input
          type="number"
          placeholder="Cost"
          className="w-full border rounded p-2"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
        >
          Create Slot
        </button>
      </form>
    </div>

  </div>
</div>)


  );
}

export default DoctorU;


