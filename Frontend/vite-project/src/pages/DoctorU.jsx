import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function DoctorU() {
  const { tokens, user } = useAuth(); // doctor info
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const ws = useRef(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // Scroll to bottom
  const scrollToBottom = () => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(scrollToBottom, [messages]);

  // Fetch all chats for this doctor
  useEffect(() => {
    if (!tokens) return;
    async function fetchChats() {
      const res = await fetch('http://localhost:3000/api/chat/my-chats', {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });
      const data = await res.json();
      setChats(data);
    }
    fetchChats();

    // WebSocket connection
    ws.current = new WebSocket('ws://localhost:3000');
    ws.current.onopen = () => {
      console.log('✅ Doctor connected to WS');
      ws.current.send(JSON.stringify({ type: 'auth', user_id: user.user_id }));
    };

    ws.current.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      // Append message if it belongs to the selected chat
      if (selectedChat && msg.chat_id === selectedChat.chat_id) {
        setMessages((prev) => [...prev, msg]);
      }
      // Optional: update last message in chat list
      setChats((prev) =>
        prev.map((c) =>
          c.chat_id === msg.chat_id ? { ...c, last_message: msg.content } : c
        )
      );
    };

    ws.current.onclose = () => console.log('❌ Disconnected from WS');
    return () => ws.current?.close();
  }, [tokens, user, selectedChat]);

  // Load messages when selecting a chat
  const selectChat = async (chat) => {
    setSelectedChat(chat);
    try {
      const res = await fetch(`http://localhost:3000/api/chat/${chat.chat_id}/messages`, {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });
      const data = await res.json();
      setMessages(data || []);
    } catch (err) {
      console.error('Failed to fetch chat messages', err);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || ws.current.readyState !== WebSocket.OPEN) return;

    ws.current.send(
      JSON.stringify({
        type: 'chat',
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
    setNewMessage('');
  };

  return (
    <div className="flex min-h-screen">
      {/* Chat list sidebar */}
      <div className="w-1/4 border-r p-4 bg-gray-100">
        <h2 className="font-bold text-lg mb-4">Patients</h2>
        {chats.map((chat) => (
          <div
            key={chat.chat_id}
            className={`p-2 cursor-pointer rounded mb-2 ${
              selectedChat?.chat_id === chat.chat_id ? 'bg-blue-200' : 'bg-white'
            }`}
            onClick={() => selectChat(chat)}
          >
            <p>Patient ID: {chat.patient_id}</p>
            <p className="text-sm text-gray-500">{chat.last_message || 'No messages yet'}</p>
          </div>
        ))}
      </div>

      {/* Chat messages */}
      <div className="flex-1 flex flex-col p-4">
        {selectedChat ? (
          <>
            <h2 className="font-bold text-xl mb-2">Chat with Patient {selectedChat.patient_id}</h2>
            <div className="flex-1 border rounded-lg p-4 overflow-y-auto bg-white">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`mb-2 flex ${
                    msg.sender_id === user.user_id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <p
                    className={`inline-block px-3 py-1 rounded-lg ${
                      msg.sender_id === user.user_id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
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
              <button
                type="submit"
                className="ml-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
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
