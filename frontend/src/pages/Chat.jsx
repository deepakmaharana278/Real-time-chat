import { useEffect, useState, useRef } from "react";
import { socket } from "../socket";
import VoiceMessage from "./VoiceMessage";
import FileShare from "./FileShare";
import MessageBubble from "./MessageBubble";
import EditBar from "./Editbar";
import useChatSocket from "../hooks/useChatSocket";

const Chat = ({ user, onLogout }) => {
  const [currentUser, setCurrentUser] = useState("");
  const [joined, setJoined] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingUser, setTypingUser] = useState("");
  const [editingMsg, setEditingMsg] = useState(null);
  const [showVoice, setShowVoice] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const bottomRef = useRef(null);

  useChatSocket({ setChat, setUsers, setTypingUser });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem("access_token");

    socket.emit("join_chat", {
      user_id: user.id,
      username: user.username,
      token: token,
    });

    setCurrentUser(user.username);
    setJoined(true);
  }, [user]);

  useEffect(() => {
    if (selectedUser) socket.emit("messages_read", { from_user: selectedUser });
  }, [selectedUser]);

  const joinChat = () => {
    if (!username.trim()) return;
    socket.emit("join_chat", { username });
    setCurrentUser(username);
    setJoined(true);
  };

  const sendMessage = () => {
    if (!message.trim()) return;
    socket.emit("send_message", {
      message,
      target: selectedUser,
      sender_id: user.id,
    });
    setMessage("");
    setTypingUser("");
  };

  const handleReact = (msgId, emoji) => {
    socket.emit("add_reaction", { message_id: msgId, emoji });
  };

  const handleEdit = (msg) => {
    setEditingMsg({ id: msg.id, text: msg.message });
  };

  const submitEdit = () => {
    if (!editingMsg?.text.trim()) return;
    socket.emit("edit_message", {
      message_id: editingMsg.id,
      new_message: editingMsg.text,
    });
    setEditingMsg(null);
  };

  const handleDelete = (msgId) => {
    socket.emit("delete_message", { message_id: msgId, delete_for_everyone: true });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            Online Users ({users.length})
            <button onClick={onLogout} className="text-sm bg-red-500 text-white px-3 py-1 rounded">
              Logout
            </button>
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {users
            .filter((user) => user !== currentUser)
            .map((user, index) => (
              <button
                key={index}
                onClick={() => setSelectedUser(user)}
                className={`w-full text-left px-4 py-3 mb-1 rounded-xl transition-all duration-200 ${selectedUser === user ? "bg-blue-50 shadow-sm" : "hover:bg-gray-50"}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-linear-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">{user.charAt(0).toUpperCase()}</div>
                  <div>
                    <p className={`font-medium ${selectedUser === user ? "text-blue-600" : "text-gray-700"}`}>{user}</p>
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
          <p className="text-sm text-gray-500 mt-1">{selectedUser ? `Chatting with ${selectedUser}` : "Select a user to start chatting"}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50">
          <div className="space-y-4">
            {chat.map((msg, index) => {
              if (msg.system) {
                return (
                  <div key={index} className="flex justify-center my-3">
                    <span className="px-4 py-2 bg-gray-100 rounded-full text-xs text-gray-500">{msg.message}</span>
                  </div>
                );
              }
              return (
                <MessageBubble key={msg.id ?? index} msg={msg} isMine={msg.username === currentUser} onReact={handleReact} onEdit={handleEdit} onDelete={handleDelete} onImageClick={setPreviewImage} />
              );
            })}
            <div ref={bottomRef} />
          </div>
        </div>

        {typingUser && typingUser !== currentUser && <div className="px-6 pb-2 text-sm text-gray-400 italic">{typingUser} is typing...</div>}

        <EditBar editingMsg={editingMsg} onChange={(text) => setEditingMsg((prev) => ({ ...prev, text }))} onSave={submitEdit} onCancel={() => setEditingMsg(null)} />

        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <FileShare selectedUser={selectedUser} />
            <div className="flex-1 relative">
              <input
                className="w-full border border-gray-200 rounded-full px-5 py-3 pr-12 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  socket.emit("typing", { target: selectedUser });
                }}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type your message..."
              />
              <button
                onClick={sendMessage}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors"
              >
                <i className="fa-solid fa-paper-plane text-xs" />
              </button>
            </div>
            <button onClick={() => setShowVoice(true)} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center">
              <i className="fas fa-microphone text-gray-500" />
            </button>
            {showVoice && <VoiceMessage currentUser={currentUser} selectedUser={selectedUser} onClose={() => setShowVoice(false)} />}
          </div>
        </div>

        {previewImage && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50" onClick={() => setPreviewImage(null)}>
            <img src={previewImage} className="max-w-[90%] max-h-[90%] rounded-lg" alt="preview" />
            <button className="absolute top-5 right-5 text-white text-2xl" onClick={() => setPreviewImage(null)}>
              <i className="fas fa-x" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
