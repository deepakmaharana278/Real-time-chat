const ReactionBubbles = ({ reactions, msgId, onReact }) => {
  if (!reactions || Object.keys(reactions).length === 0) return null;

  return (
    <div className="flex gap-1 mt-1 flex-wrap">
      {Object.entries(reactions).map(([emoji, users]) => (
        <button
          key={emoji}
          onClick={() => onReact(msgId, emoji)}
          className="flex items-center gap-1 bg-white border border-gray-200 rounded-full px-2 py-0.5 text-xs shadow-sm hover:bg-gray-50 transition"
        >
          <span>{emoji}</span>
          <span className="text-gray-500">{users.length}</span>
        </button>
      ))}
    </div>
  );
};

export default ReactionBubbles;