import React, { useEffect, useState } from "react";
import { socket } from "../socket";

const Chat = () => {
  const [username, setUsername] = useState("");
  const [currentUser, setCurrentUser] = useState("");
  const [joined, setJoined] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [users, setUsers] = useState([]);

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
      socket.off("chat_history")
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
    <div className="flex h-screen">
      <div className="w-1/4 bg-gray-200 p-4">
        <h2 className="font-bold mb-3">Online Users</h2>

        {users.map((user, index) => (
          <p key={index} className={`mb-1 cursor-pointer p-1 rounded ${selectedUser === user ? "bg-blue-300" : ""}`} onClick={() => setSelectedUser(user)}>
            {user}
          </p>
        ))}
      </div>

      <div className="flex flex-col w-3/4 p-4">
        <h1 className="text-2xl font-bold mb-4">Deepak Chat</h1>

        <div className="flex-1 border p-4 overflow-y-scroll mb-3">
          {chat.map((msg, index) => {
            const isMine = msg.username === currentUser;

            return msg.system ? (
              <p key={index} className="text-center text-gray-500">
                {msg.message}
              </p>
            ) : (
              <div key={index} className={`flex ${isMine ? "justify-end" : "justify-start"} mb-2`}>
                <div
                  className={`px-3 py-2 rounded-lg max-w-xs
                  ${isMine ? "bg-blue-500 text-white" : "bg-gray-300 text-black"}`}
                >
                  <strong>
                    {msg.private ? "(Private) " : ""}
                    {msg.username}
                  </strong>: {msg.message}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2">
          <input className="border p-2 flex-1" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()}/>

          <button className="bg-blue-500 text-white px-4" onClick={sendMessage}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
