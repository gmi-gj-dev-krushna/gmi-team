import React from 'react';

function RightContextMenu({ node }) {
  return (
    <aside className="w-64 bg-gray-50 p-4 border-l border-gray-200 shadow-inner">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Node Details</h2>
        {node && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">ID: {node.id}</p>
            <p className="text-sm font-medium text-gray-600">Label: {node.data.label}</p>
            <p className="text-sm font-medium text-gray-600">Position: ({node.position.x}, {node.position.y})</p>
          </div>
        )}
      </div>
    </aside>
  );
}

export default RightContextMenu;