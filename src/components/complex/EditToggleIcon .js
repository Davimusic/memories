import React from "react";
import "../../estilos/music/icon.css";

const EditToggleIcon = ({ size = 24, iconColor = "black", onClick }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      onClick={onClick}
      style={{
        cursor: "pointer",
        transition: "transform 0.3s ease",
      }}
    >
      {/* Ícono de lápiz */}
      <path d="M3 21v-3L17 4l3 3L6 21H3z" fill={iconColor} />
    </svg>
  );
};

export default EditToggleIcon;

