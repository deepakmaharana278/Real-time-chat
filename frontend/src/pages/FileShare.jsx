import React, { useRef } from "react";
import { socket } from "../socket";

const FileShare = ({ selectedUser }) => {
    const fileInputRef = useRef();
    
    const uploadFile = async (file, e) => {
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
      
    // Upload files one by one
    for (let i = 0; i < files.length; i++) {
      await uploadFile(files[i], e);
    }

    e.target.value = null;
  };

  return (
    <>
      <input type="file" ref={fileInputRef} hidden onChange={(e) => handleFileUpload(e.target.files, e)} multiple />

      <button onClick={() => fileInputRef.current.click()} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center">
        <i className="fas fa-paperclip text-gray-500"></i>
      </button>
    </>
  );
};

export default FileShare;
