import React from 'react';
import { Handle, Position } from '@xyflow/react';

const CEONodeWithPlusIcon = ({ data, selected }) => {
  const baseStyle = {
    background: "#2563EB",
    color: "white",
    fontWeight: "bold",
    borderRadius: "50%",
    width: 100,
    height: 100,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    position: "relative",
    border: selected ? "3px solid #60A5FA" : "2px solid #1E40AF",
  };

  const plusIconStyle = {
    position: "absolute",
    bottom: "1px",
    right: "1px",
    background: "#10B981",
    color: "white",
    borderRadius: "50%",
    width: "24px",
    height: "24px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
    zIndex: 10,
    transition: "all 0.2s ease",
  };

  const handleAddAgent = (e) => {
    e.stopPropagation();
    if (data.onAddAgent) {
      data.onAddAgent();
    }
  };

  return (
    <div style={baseStyle}>
      {/* Main node content */}
      <div>{data.label}</div>
      
      {/* Plus icon */}
      <div 
        style={plusIconStyle}
        onClick={handleAddAgent}
        onMouseEnter={(e) => {
          e.target.style.background = "#059669";
          e.target.style.transform = "scale(1.1)";
        }}
        onMouseLeave={(e) => {
          e.target.style.background = "#10B981";
          e.target.style.transform = "scale(1)";
        }}
        title="Add new agent"
      >
        +
      </div>

      {/* Connection handles */}
      <Handle
        type="source"
        position={Position.Top}
        style={{ opacity: 0 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ opacity: 0 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ opacity: 0 }}
      />
      <Handle
        type="source"
        position={Position.Left}
        style={{ opacity: 0 }}
      />
      <Handle
        type="target"
        position={Position.Top}
        style={{ opacity: 0 }}
      />
      <Handle
        type="target"
        position={Position.Right}
        style={{ opacity: 0 }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        style={{ opacity: 0 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        style={{ opacity: 0 }}
      />
    </div>
  );
};

export default CEONodeWithPlusIcon;