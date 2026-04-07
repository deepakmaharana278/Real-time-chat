import { useState } from "react";
import Ticks from "./Ticks";
import ReactionBubbles from "./ReactionBubbles";
import MessageMenu from "./MessageMenu";

const MessageBubble = ({ msg, isMine, onReact, onEdit, onDelete, onImageClick }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
    setEmojiPickerOpen(false);
  };

  const handleEdit = (msg) => {
    onEdit(msg);
    closeMenu();
  };

  const handleDelete = (id) => {
    onDelete(id);
    closeMenu();
  };

  const handleReact = (msgId, emoji) => {
    onReact(msgId, emoji);
    closeMenu();
  };

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[70%] ${isMine ? "flex-row-reverse" : "flex-row"} items-end gap-2`}>

        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-sm font-semibold ${
            isMine
              ? "bg-blue-100 text-blue-600"
              : "bg-linear-to-br from-purple-400 to-purple-600 text-white"
          }`}
        >
          {msg.username.charAt(0).toUpperCase()}
        </div>

        {/* Bubble + menu */}
        <div className="relative group">

          {/* Chevron trigger */}
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className={`absolute top-1 ${
              isMine ? "left-0 -translate-x-full pl-1" : "right-0 translate-x-full pr-1"
            } opacity-0 group-hover:opacity-100 transition-opacity z-10 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-400`}
          >
            <i className="fas fa-chevron-down text-[10px]" />
          </button>

          {/* Context menu */}
          <MessageMenu
            msg={msg}
            isMine={isMine}
            isOpen={menuOpen}
            showEmojiPicker={emojiPickerOpen}
            onClose={closeMenu}
            onToggleEmoji={() => setEmojiPickerOpen(true)}
            onReact={handleReact}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

          <div
            className={`px-4 py-2 rounded-2xl shadow-sm ${
              isMine
                ? "bg-gray-700 text-white rounded-br-none"
                : "bg-white text-gray-800 rounded-bl-none border border-gray-200"
            } ${msg.is_deleted ? "opacity-60 italic" : ""}`}
          >
            {msg.private && (
              <span className="text-xs font-medium opacity-75 block mb-1">
                <i className="fas fa-lock" /> Private
              </span>
            )}

            {msg.is_deleted ? (
              <p className="text-sm flex items-center gap-1">
                <i className="fas fa-ban text-xs" /> This message was deleted
              </p>
            ) : msg.msg_type === "file" ? (
              <div className="mt-1">
                {msg.file_url?.match(/\.(jpg|png|jpeg|gif)$/i) ? (
                  <img
                    src={msg.file_url}
                    className="w-40 rounded-lg cursor-pointer hover:scale-105 transition"
                    onClick={() => onImageClick(msg.file_url)}
                    alt="shared"
                  />
                ) : (
                  <a
                    href={msg.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 underline"
                  >
                    <i className="fas fa-file" /> {msg.file_name}
                  </a>
                )}
              </div>
            ) : msg.msg_type === "audio" ? (
              <audio
                controls
                src={`data:audio/webm;base64,${msg.audio}`}
                className="w-48 h-8 mt-1"
              />
            ) : (
              <p className="text-sm wrap-break-word">{msg.message}</p>
            )}

            {/* Edited label */}
            {msg.is_edited && !msg.is_deleted && (
              <span className={`text-[10px] ${isMine ? "text-blue-200" : "text-gray-400"}`}>
                {" "}(edited)
              </span>
            )}

            <p className={`text-[10px] mt-1 text-right ${isMine ? "text-blue-100" : "text-gray-400"}`}>
              {msg.time}
              <Ticks status={msg.status} isMine={isMine} isPrivate={msg.private} />
            </p>
          </div>

          {/* Reaction bubbles */}
          <div className={isMine ? "flex justify-end" : ""}>
            <ReactionBubbles
              reactions={msg.reactions}
              msgId={msg.id}
              onReact={onReact}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;