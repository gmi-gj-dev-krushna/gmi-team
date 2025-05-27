import React from 'react';
import { Link } from 'react-router-dom';

function LeftSidebar({ activePage, setActivePage }) {
  return (
    <aside className="w-64 bg-gray-100 p-4 border-r border-gray-200 min-h-screen overflow-y-auto">
      <nav className="space-y-2">
        <Link
          to="/gmi-team"
          className={`block p-3 rounded-lg transition-all duration-200 ${
            activePage === 'gmi-team'
              ? 'bg-blue-500 text-white shadow-md'
              : 'hover:bg-gray-200 text-gray-700 hover:text-gray-900'
          }`}
          onClick={() => setActivePage('gmi-team')}
        >
          <div className="flex items-center space-x-3">
            <span className="font-medium">GMI Team</span>
          </div>
        </Link>
        <Link
          to="/sdlc-team"
          className={`block p-2 rounded ${activePage === 'sdlc-team' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}
          onClick={() => setActivePage('sdlc-team')}
        >
          SDLC Team
        </Link>
        <Link
          to="/product-team"
          className={`block p-2 rounded ${activePage === 'product-team' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}
          onClick={() => setActivePage('product-team')}
        >
          Product Team
        </Link>
        <Link
          to="/c-executive"
          className={`block p-2 rounded ${activePage === 'c-executive' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}
          onClick={() => setActivePage('c-executive')}
        >
          C-Executive
        </Link>
        <Link
          to="/tendors"
          className={`block p-2 rounded ${activePage === 'tendors' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}
          onClick={() => setActivePage('tendors')}
        >
          Tendors
        </Link>
      </nav>
    </aside>
  );
}

export default LeftSidebar;