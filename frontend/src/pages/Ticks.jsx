const Ticks = ({ status, isMine, isPrivate }) => {
  if (!isMine || !status || !isPrivate) return null;

  if (status === "read" || status === "delivered")
    return (
      <span className="text-blue-400 text-xs">
        <i className="fa-solid fa-check-double text-xs" />
      </span>
    );

  return (
    <span className="text-gray-300 text-xs">
      <i className="fa-solid fa-check text-xs" />
    </span>
  );
};

export default Ticks;