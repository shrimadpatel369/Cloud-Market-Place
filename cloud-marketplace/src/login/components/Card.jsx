import React from 'react';

const Card = ({ children, className = '' }) => {
  return (
    <div className={`bg-white rounded-xl shadow-2xl p-8 border border-slate-100 ${className}`}>
      {children}
    </div>
  );
};

export default Card;
