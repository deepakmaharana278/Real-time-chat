import { useState, useEffect } from "react";
import { socket } from "./socket";

function App() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  const sendMessage = () => {
    socket.emit("send_message", message);
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

  return (
    <div className="flex flex-col items-center mt-10">

      <h1 className="text-2xl font-bold mb-4">Deepak Chat</h1>

      <div className="border w-80 h-80 overflow-y-scroll p-3 mb-3">
        {chat.map((msg, index) => (
          <p key={index} className="bg-blue-100 p-2 rounded mb-1">
            {msg}
          </p>
        ))}
      </div>

      <input
        className="border p-2 w-60"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button
        className="bg-blue-500 text-white px-4 py-2 mt-2 rounded"
        onClick={sendMessage}
      >
        Send
      </button>

    </div>
  );
}

export default App;