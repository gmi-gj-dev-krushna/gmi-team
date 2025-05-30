import React, { useState, useEffect } from 'react';

const API_BASE_URL = "http://127.0.0.1:8000";

const AddAgentModal = ({ isOpen, onClose, onAddAgent, ceoId }) => {
  const [agentData, setAgentData] = useState({
    name: '',
    role: '',
    goal: '',
    backstory: [''],
  });
  const [myAgents, setMyAgents] = useState([]);

  // Fetch all my agents for Quick Templates
  useEffect(() => {
    if (isOpen) {
      fetch(`${API_BASE_URL}/agents/my-agents`)
        .then(res => res.json())
        .then(data => setMyAgents(data.agents || []))
        .catch(() => setMyAgents([]));
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (agentData.name && agentData.role) {
      onAddAgent({
        ...agentData,
        backstory: agentData.backstory.filter(story => story.trim() !== '')
      });
      // Reset form
      setAgentData({
        name: '',
        role: '',
        goal: '',
        backstory: [''],
      });
      onClose();
    }
  };

  const handleTemplateSelect = (agent) => {
    setAgentData({
      id: agent.agent_id || agent.id,
      name: agent.name || agent.agent_name || '',
      role: agent.role || '',
      goal: agent.goal || '',
      backstory: Array.isArray(agent.backstory)
        ? agent.backstory
        : (typeof agent.backstory === 'string' ? agent.backstory.split('\n') : ['']),
    });
  };

  const addBackstoryField = () => {
    setAgentData(prev => ({
      ...prev,
      backstory: [...prev.backstory, '']
    }));
  };

  const updateBackstory = (index, value) => {
    setAgentData(prev => ({
      ...prev,
      backstory: prev.backstory.map((story, i) => i === index ? value : story)
    }));
  };

  const removeBackstory = (index) => {
    if (agentData.backstory.length > 1) {
      setAgentData(prev => ({
        ...prev,
        backstory: prev.backstory.filter((_, i) => i !== index)
      }));
    }
  };

  // Filter out CEO from myAgents
  const filteredAgents = myAgents.filter(
    agent => (agent.agent_id || agent.id) !== ceoId
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Create New Agent</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        {/* Quick Templates from my agents */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Quick Templates:</h3>
          <div className="flex gap-2 flex-wrap">
            {filteredAgents.length > 0 ? (
              filteredAgents.map((agent, index) => (
                <button
                  key={agent.agent_id || index}
                  type="button"
                  onClick={() => handleTemplateSelect(agent)}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
                >
                  {agent.name?.replace('_agent', '').toUpperCase() || agent.agent_name?.replace('_agent', '').toUpperCase() || `Agent ${index + 1}`}
                </button>
              ))
            ) : (
              <span className="text-gray-400">No templates available.</span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Agent Name *</label>
            <input
              type="text"
              value={agentData.name}
              onChange={(e) => setAgentData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="e.g., CFO_agent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Role *</label>
            <input
              type="text"
              value={agentData.role}
              onChange={(e) => setAgentData(prev => ({ ...prev, role: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Brief description of the role"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Goal</label>
            <textarea
              value={agentData.goal}
              onChange={(e) => setAgentData(prev => ({ ...prev, goal: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 h-20"
              placeholder="What is this agent's primary objective?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Backstory</label>
            {agentData.backstory.map((story, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={story}
                  onChange={(e) => updateBackstory(index, e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                  placeholder={`Backstory point ${index + 1}`}
                />
                {agentData.backstory.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeBackstory(index)}
                    className="px-2 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200"
                  >
                    −
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addBackstoryField}
              className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm"
            >
              + Add backstory point
            </button>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={!agentData.name || !agentData.role}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Create & Add Agent
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAgentModal;