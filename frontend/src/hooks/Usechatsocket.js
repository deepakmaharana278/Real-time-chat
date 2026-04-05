import { useEffect } from "react";
import { socket } from "../socket";

const useChatSocket = ({ setChat, setUsers, setTypingUser }) => {

  useEffect(() => {
    socket.on("connect", () => console.log("Connected:", socket.id));

    socket.on("chat_history", (messages) => setChat(messages));

    socket.on("receive_message", (data) =>
      setChat((prev) => [...prev, data])
    );

    socket.on("typing", (data) => {
      setTypingUser(data.username);
      setTimeout(() => setTypingUser(""), 1500);
    });

    socket.on("message_status", (data) => {
      setChat((prev) =>
        prev.map((msg) => {
          if (data.id  && msg.id === data.id)        return { ...msg, status: data.status };
          if (data.ids && data.ids.includes(msg.id)) return { ...msg, status: data.status };
          return msg;
        })
      );
    });

    socket.on("users_list", (data) => setUsers(data));

    socket.on("reaction_updated", ({ message_id, reactions }) => {
      setChat((prev) =>
        prev.map((msg) =>
          msg.id === message_id ? { ...msg, reactions } : msg
        )
      );
    });

    socket.on("message_edited", ({ message_id, new_message }) => {
      setChat((prev) =>
        prev.map((msg) =>
          msg.id === message_id
            ? { ...msg, message: new_message, is_edited: true }
            : msg
        )
      );
    });

    socket.on("message_deleted", ({ message_id }) => {
      setChat((prev) =>
        prev.map((msg) =>
          msg.id === message_id
            ? { ...msg, message: "This message was deleted", is_deleted: true }
            : msg
        )
      );
    });

    return () => {
      socket.off("chat_history");
      socket.off("receive_message");
      socket.off("users_list");
      socket.off("typing");
      socket.off("message_status");
      socket.off("reaction_updated");
      socket.off("message_edited");
      socket.off("message_deleted");
    };
  }, [setChat, setUsers, setTypingUser]);
};

export default useChatSocket;