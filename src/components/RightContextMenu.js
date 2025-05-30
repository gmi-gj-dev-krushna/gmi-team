import React, { useState, useEffect } from 'react';

function RightContextMenu({ node, agent, onUpdateAgent }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    if (agent && !isEditing) {
      setEditData({
        name: agent.name || '',
        role: agent.role || '',
        goal: agent.goal || '',
        backstory: Array.isArray(agent.backstory)
          ? [...agent.backstory]
          : typeof agent.backstory === 'string'
            ? agent.backstory.split('\n')
            : [''],
        verbose:
          agent.verbose !== undefined
            ? agent.verbose
            : agent.agent_data?.verbose !== undefined
              ? agent.agent_data.verbose
              : true
      });
    }
  }, [agent, isEditing]);

  if (!node) return null;

  const { name, role, goal, backstory, verbose } = node.data || {};

  const startEditing = () => setIsEditing(true);

  const cancelEditing = () => {
    setIsEditing(false);
    if (agent) {
      setEditData({
        name: agent.name || '',
        role: agent.role || '',
        goal: agent.goal || '',
        backstory: Array.isArray(agent.backstory)
          ? [...agent.backstory]
          : typeof agent.backstory === 'string'
            ? agent.backstory.split('\n')
            : [''],
        verbose:
          agent.verbose !== undefined
            ? agent.verbose
            : agent.agent_data?.verbose !== undefined
              ? agent.agent_data.verbose
              : true
      });
    }
  };

  const saveChanges = () => {
    if (onUpdateAgent) {
      onUpdateAgent(node.id, {
        ...editData,
        backstory: Array.isArray(editData.backstory)
          ? editData.backstory.filter(story => story.trim() !== '')
          : (typeof editData.backstory === 'string'
            ? editData.backstory.split('\n').filter(story => story.trim() !== '')
            : []),
        verbose: !!editData.verbose
      });
    }
    setIsEditing(false);
  };

  const addBackstoryField = () => {
    setEditData(prev => ({
      ...prev,
      backstory: [...(prev.backstory || []), '']
    }));
  };

  const updateBackstory = (index, value) => {
    setEditData(prev => ({
      ...prev,
      backstory: (prev.backstory || []).map((story, i) => i === index ? value : story)
    }));
  };

  const removeBackstory = (index) => {
    if (editData.backstory && editData.backstory.length > 1) {
      setEditData(prev => ({
        ...prev,
        backstory: prev.backstory.filter((_, i) => i !== index)
      }));
    }
  };

  return (
    <aside className="w-80 bg-gray-50 p-4 border-l border-gray-200 shadow-inner overflow-y-auto">
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-700">Node Details</h2>
          {!isEditing && node.id !== 'ceo' && (
            <button
              onClick={startEditing}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm"
            >
              Edit
            </button>
          )}
        </div>

        {!isEditing ? (
          // View Mode
          <div className="space-y-2">
            {name && (
              <div>
                <p className="text-sm font-semibold text-gray-700">Name:</p>
                <p className="text-sm text-gray-600 ml-2">{name}</p>
              </div>
            )}
            {role && (
              <div>
                <p className="text-sm font-semibold text-gray-700">Role:</p>
                <p className="text-sm text-gray-600 ml-2">{role}</p>
              </div>
            )}
            {goal && (
              <div>
                <p className="text-sm font-semibold text-gray-700">Goal:</p>
                <p className="text-sm text-gray-600 ml-2">{goal}</p>
              </div>
            )}
            {Array.isArray(backstory) && backstory.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Backstory:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  {backstory.map((item, idx) => (
                    <li key={idx} className="text-sm text-gray-600">{item}</li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-gray-700">Verbose:</p>
              <p className="text-sm text-gray-600 ml-2">
                {verbose === true ? 'true' : verbose === false ? 'false' : '—'}
              </p>
            </div>
          </div>
        ) : (
          // Edit Mode
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agent Name</label>
              <input
                type="text"
                value={editData.name}
                onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <input
                type="text"
                value={editData.role}
                onChange={(e) => setEditData(prev => ({ ...prev, role: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Goal</label>
              <textarea
                value={editData.goal}
                onChange={(e) => setEditData(prev => ({ ...prev, goal: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 h-20 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Backstory</label>
              {(editData.backstory || []).map((story, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={story}
                    onChange={(e) => updateBackstory(index, e.target.value)}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder={`Backstory point ${index + 1}`}
                  />
                  {editData.backstory && editData.backstory.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBackstory(index)}
                      className="px-2 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 text-sm"
                    >
                      −
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addBackstoryField}
                className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm mb-4"
              >
                + Add backstory point
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Verbose</label>
              <input
                type="checkbox"
                checked={!!editData.verbose}
                onChange={e => setEditData(prev => ({ ...prev, verbose: e.target.checked }))}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Enable verbose mode</span>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <button
                onClick={saveChanges}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 text-sm"
              >
                Save
              </button>
              <button
                onClick={cancelEditing}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

export default RightContextMenu;