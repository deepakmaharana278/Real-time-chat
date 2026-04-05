const EditBar = ({ editingMsg, onChange, onSave, onCancel }) => {
  if (!editingMsg) return null;

  return (
    <div className="px-6 py-2 bg-blue-50 border-t border-blue-100">
      <div className="flex items-center gap-2 text-xs text-blue-600 mb-1">
        <i className="far fa-edit" />
        <span>Editing message</span>
        <button
          onClick={onCancel}
          className="ml-auto text-gray-400 hover:text-gray-600"
        >
          <i className="fas fa-times" />
        </button>
      </div>

      <div className="flex gap-2">
        <input
          autoFocus
          className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          value={editingMsg.text}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSave();
            if (e.key === "Escape") onCancel();
          }}
        />
        <button
          onClick={onSave}
          className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 rounded-full transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default EditBar;