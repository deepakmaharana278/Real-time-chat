import React, { useEffect, useState, useRef } from "react";
import { socket } from "../socket";

const Chat = () => {
  const [username, setUsername] = useState("");
  const [currentUser, setCurrentUser] = useState("");
  const [joined, setJoined] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [users, setUsers] = useState([]);
  const bottomRef = useRef(null);

  const joinChat = () => {
    if (!username.trim()) return;

    socket.emit("join_chat", { username });

    setCurrentUser(username);
    setJoined(true);
  };

  const sendMessage = () => {
    if (!message.trim()) return;

    socket.emit("send_message", {
      message: message,
      target: selectedUser,
    });
    setMessage("");
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected:", socket.id);
    });

    socket.on("chat_history", (messages) => {
      setChat(messages);
    });

    socket.on("receive_message", (data) => {
      setChat((prev) => [...prev, data]);
    });

    socket.on("users_list", (data) => {
      setUsers(data);
    });

    return () => {
      socket.off("chat_history");
      socket.off("receive_message");
      socket.off("users_list");
    };
  }, []);

  if (!joined) {
    return (
      <div className="flex flex-col items-center mt-20">
        <h1 className="text-2xl mb-4">Join Chat</h1>

        <input className="border p-2 mb-2" placeholder="Enter username" onChange={(e) => setUsername(e.target.value)} />

        <button className="bg-blue-500 text-white px-4 py-2" onClick={joinChat}>
          Join
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">

  <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
    <div className="p-5 border-b border-gray-200">
      <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
        Online Users ({users.length})
      </h2>
    </div>
    
    <div className="flex-1 overflow-y-auto p-3">
      {users.map((user, index) => (
        <button
          key={index}
          onClick={() => setSelectedUser(user)}
          className={`w-full text-left px-4 py-3 mb-1 rounded-xl transition-all duration-200 
            ${selectedUser === user 
              ? "bg-blue-50 border-blue-200 shadow-sm" 
              : "hover:bg-gray-50"}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-linear-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              {user.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className={`font-medium ${selectedUser === user ? "text-blue-600" : "text-gray-700"}`}>
                {user}
              </p>
              <p className="text-xs text-gray-400">Click to chat</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  </div>


  <div className="flex-1 flex flex-col bg-white">
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <h1 className="text-xl font-semibold text-gray-800">Deepak Chat</h1>
      <p className="text-sm text-gray-500 mt-1">
        {selectedUser ? `Chatting with ${selectedUser}` : 'Select a user to start chatting'}
      </p>
    </div>


    <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50">
      <div className="space-y-4">
        {chat.map((msg, index) => {
          const isMine = msg.username === currentUser;

          if (msg.system) {
            return (
              <div key={index} className="flex justify-center my-3">
                <span className="px-4 py-2 bg-gray-100 rounded-full text-xs text-gray-500">
                  {msg.message}
                </span>
              </div>
            );
          }

          return (
            <div key={index} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`flex max-w-[70%] ${isMine ? "flex-row-reverse" : "flex-row"} items-end gap-2`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full shrink-0 ${
                  isMine 
                    ? "bg-blue-100" 
                    : "bg-linear-to-br from-purple-400 to-purple-600"
                } flex items-center justify-center text-sm font-semibold ${
                  isMine ? "text-blue-600" : "text-white"
                }`}>
                  {msg.username.charAt(0).toUpperCase()}
                </div>

                <div>
                  <div
                    className={`px-4 py-2 rounded-2xl shadow-sm
                      ${isMine 
                        ? "bg-blue-500 text-white rounded-br-none" 
                        : "bg-white text-gray-800 rounded-bl-none border border-gray-200"}`}
                  >
                    {msg.private && (
                      <span className="text-xs font-medium opacity-75 block mb-1">
                        <i className="fas fa-lock"></i> Private
                      </span>
                    )}
                    <p className="text-sm wrap-break-words">{msg.message}</p>
                    <p className={`text-[10px] mt-1 text-right ${
                      isMine ? "text-blue-100" : "text-gray-400"
                    }`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>


    <div className="bg-white border-t border-gray-200 px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <input
            className="w-full border border-gray-200 rounded-full px-5 py-3 pr-12 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type your message..."
          />
          <button
            onClick={sendMessage}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <i className="fa-solid fa-paper-plane text-xs"></i>
          </button>
            </div>
            <button className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center">
          <i className="fas fa-microphone text-gray-500"></i>
        </button>
      </div>
    </div>
  </div>
</div>
  );
};

export default Chat;
