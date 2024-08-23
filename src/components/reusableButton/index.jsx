// components/Button.js
import React from 'react';

const rButton = ({ label, onClick, className }) => {
  return (
    <button 
      onClick={onClick} 
      className={`py-2 px-4 rounded text-white ${className}`} 
    >
      {label}
    </button>
  );
};

export default rButton;
