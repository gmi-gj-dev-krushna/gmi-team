import React from 'react';

function Header() {
  return (
    <header className="bg-[#2929ff] shadow-md p-4 sticky top-0 z-50">
      <div className="mx-auto flex justify-between items-center">
        <h1 className="text-xl font-semibold text-white">GMI Dashboard</h1>
      </div>
    </header>
  );
}

export default Header;