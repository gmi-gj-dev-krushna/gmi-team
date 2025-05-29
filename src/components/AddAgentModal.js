import React, { useState } from 'react';

const AddAgentModal = ({ isOpen, onClose, onAddAgent }) => {
  const [agentData, setAgentData] = useState({
    label: '',
    name: '',
    role: '',
    goal: '',
    backstory: [''],
  });

  const predefinedAgents = [
    {
      label: 'CFO',
      name: 'CFO_agent',
      role: 'Chief Financial Officer specializing in financial strategy and risk management',
      goal: 'Optimize financial performance, manage risk, and ensure sustainable growth through strategic financial planning.',
      backstory: [
        'Experienced CFO with 15+ years in financial leadership across various industries.',
        'Expert in financial planning, budgeting, and risk assessment.',
        'Known for data-driven decision making and strategic cost optimization.',
        'Strong background in investor relations and financial compliance.',
      ],
      color: '#DC2626'
    },
    {
      label: 'CHRO',
      name: 'CHRO_agent',
      role: 'Chief Human Resources Officer focused on talent development and organizational culture',
      goal: 'Build and maintain a high-performing workforce through strategic HR initiatives and culture development.',
      backstory: [
        'Strategic HR leader with expertise in talent acquisition and development.',
        'Champion of diversity, equity, and inclusion initiatives.',
        'Experienced in organizational change management and culture transformation.',
        'Known for building strong employee engagement and retention programs.',
      ],
      color: '#7C3AED'
    },
    {
      label: 'CSO',
      name: 'CSO_agent',
      role: 'Chief Strategy Officer driving long-term strategic planning and execution',
      goal: 'Develop and execute comprehensive strategies that drive sustainable competitive advantage.',
      backstory: [
        'Strategic planning expert with deep market analysis capabilities.',
        'Experienced in mergers, acquisitions, and strategic partnerships.',
        'Known for translating vision into actionable strategic roadmaps.',
        'Strong background in competitive intelligence and market positioning.',
      ],
      color: '#059669'
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (agentData.label && agentData.name && agentData.role) {
      onAddAgent({
        ...agentData,
        backstory: agentData.backstory.filter(story => story.trim() !== '')
      });
      setAgentData({
        label: '',
        name: '',
        role: '',
        goal: '',
        backstory: [''],
      });
      onClose();
    }
  };

  const handlePredefinedSelect = (predefined) => {
    setAgentData(predefined);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add New Agent</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        {/* Predefined agents */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Quick Add:</h3>
          <div className="flex gap-2 flex-wrap">
            {predefinedAgents.map((agent, index) => (
              <button
                key={index}
                onClick={() => handlePredefinedSelect(agent)}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
              >
                {agent.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Label *</label>
            <input
              type="text"
              value={agentData.label}
              onChange={(e) => setAgentData(prev => ({ ...prev, label: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="e.g., CFO, CRO, etc."
              required
            />
          </div>

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
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Add Agent
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