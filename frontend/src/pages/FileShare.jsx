import React, { useRef, useState } from "react";
import { socket } from "../socket";

const FileShare = ({ selectedUser }) => {
  const fileInputRef = useRef();
  const [previewFiles, setPreviewFiles] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  const getFileIcon = (file) => {
    if (file.type.startsWith("image/")) return "image";
    if (file.type === "application/pdf") return "pdf";
    return "file";
  };

  const createPreview = (files) => {
    const newPreviews = Array.from(files).map((file) => ({
      id: Date.now() + Math.random(),
      file: file,
      type: file.type,
      name: file.name,
      size: file.size,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      icon: getFileIcon(file),
    }));
    setPreviewFiles((prev) => [...prev, ...newPreviews]);
    setShowPreview(true);
  };

  const removePreview = (id) => {
    setPreviewFiles((prev) => {
      const removed = prev.find((f) => f.id === id);
      if (removed?.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
    if (previewFiles.length === 1) {
      setShowPreview(false);
    }
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/upload/", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      socket.emit("send_file", {
        file_url: data.file_url,
        file_name: data.file_name,
        target: selectedUser,
      });
    } catch (err) {
      console.error(`Upload error for ${file.name}:`, err);
    }
  };

  const handleFileUpload = async (files, e) => {
    if (!files || files.length === 0) return;

    createPreview(files);
    e.target.value = null;
  };

  const handleSendFiles = async () => {
    // Upload files one by one
    for (let i = 0; i < previewFiles.length; i++) {
      await uploadFile(previewFiles[i].file);
    }

    // Clear previews after sending
    previewFiles.forEach((file) => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setPreviewFiles([]);
    setShowPreview(false);
  };

  const handleCancel = () => {
    // Clean up object URLs
    previewFiles.forEach((file) => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setPreviewFiles([]);
    setShowPreview(false);
  };

  return (
    <>
      {showPreview && previewFiles.length > 0 && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl border border-gray-200 w-96 z-50">
          <div className="p-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-700">Preview ({previewFiles.length})</h3>
            <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="p-3 max-h-64 overflow-y-auto">
            <div className="grid grid-cols-3 gap-2">
              {previewFiles.map((file) => (
                <div key={file.id} className="relative group">
                  <div className="aspect-square bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center">
                    {file.type.startsWith("image/") ? (
                      <img src={file.preview} alt={file.name} className="w-full h-full object-cover rounded-lg" />
                    ) : file.type === "application/pdf" ? (
                      <div className="text-center">
                        <i className="fas fa-file-pdf text-red-500 text-3xl"></i>
                        <p className="text-xs text-gray-500 mt-1 truncate w-full px-1">{file.name}</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <i className="fas fa-file text-gray-400 text-3xl"></i>
                        <p className="text-xs text-gray-500 mt-1 truncate w-full px-1">{file.name}</p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removePreview(file.id)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 border-t border-gray-200 flex justify-between">
            <button onClick={handleCancel} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              Cancel
            </button>
            <button onClick={handleSendFiles} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2">
              Send <i className="fas fa-arrow-right text-xs"></i>
            </button>
          </div>
        </div>
      )}

      <input type="file" ref={fileInputRef} hidden onChange={(e) => handleFileUpload(e.target.files, e)} multiple />

      <button onClick={() => fileInputRef.current.click()} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center">
        <i className="fas fa-paperclip text-gray-500"></i>
      </button>
    </>
  );
};

export default FileShare;
