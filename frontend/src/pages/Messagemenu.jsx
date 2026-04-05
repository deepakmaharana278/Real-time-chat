import { useRef, useEffect } from "react";

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "👏"];

const MessageMenu = ({
  msg,
  isMine,
  isOpen,
  showEmojiPicker,
  onClose,
  onToggleEmoji,
  onReact,
  onEdit,
  onDelete,
}) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className={`absolute z-20 top-0 flex flex-col gap-0.5 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-32.5 ${
        isMine ? "right-full mr-2" : "left-full ml-2"
      }`}
    >
      {/* Emoji picker */}
      {showEmojiPicker ? (
        <div className="flex gap-1 px-2 py-1">
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => onReact(msg.id, e)}
              className="text-lg hover:scale-125 transition-transform"
            >
              {e}
            </button>
          ))}
        </div>
      ) : (
        <button
          onClick={onToggleEmoji}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
        >
          <i className="far fa-smile w-4" /> React
        </button>
      )}

      {isMine && !msg.is_deleted && msg.msg_type !== "audio" && msg.msg_type !== "file" && (
        <button
          onClick={() => onEdit(msg)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
        >
          <i className="far fa-edit w-4" /> Edit
        </button>
      )}

      {isMine && !msg.is_deleted && (
        <button
          onClick={() => onDelete(msg.id)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 w-full text-left"
        >
          <i className="far fa-trash-alt w-4" /> Delete
        </button>
      )}
    </div>
  );
};

export default MessageMenu;