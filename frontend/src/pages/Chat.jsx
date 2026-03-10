import React, { useEffect, useState } from "react";
import { socket } from "../socket";

const Chat = () => {
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);

  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  const joinChat = () => {
    if (username.trim() === "") return;

    socket.emit("join_chat", { username });
    setJoined(true);
  };

  const sendMessage = () => {
    if (message.trim() === "") return;
    socket.emit("send_message", { message });
    setMessage("");
  };

  useEffect(() => {
    socket.on("receive_message", (data) => {
      setChat((prev) => [...prev, data]);
    });

    return () => {
      socket.off("receive_message");
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
    <div className="flex flex-col items-center mt-10">
      <h1 className="text-2xl font-bold mb-4">Deepak Chat</h1>

      <div className="border w-80 h-80 overflow-y-scroll p-3 mb-3">
        {chat.map((msg, index) => (

          msg.system ? (

            <p key={index} className="text-center text-gray-500">
              {msg.message}
            </p>
          ): (
              <p key={index}>
              <strong>{msg.username}</strong>: {msg.message}
            </p>
          )
        ))}
      </div>

      <div className="flex gap-2">

        <input
          className="border p-2"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <button
          className="bg-blue-500 text-white px-4"
          onClick={sendMessage}
        >
          Send
        </button>

      </div>
    </div>
  );
};

export default Chat;
