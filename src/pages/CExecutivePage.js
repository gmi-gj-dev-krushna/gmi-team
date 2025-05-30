import { useCallback, useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import FloatingEdge from "../components/FloatingEdge";
import FloatingConnectionLine from "../components/FloatingConnectionLine";
import RightContextMenu from "../components/RightContextMenu";
import CEONodeWithPlusIcon from "../components/CEONodeWithPlusIcon";
import AgentNodeWithControls from "../components/AgentNodeWithControls";
import AddAgentModal from "../components/AddAgentModal";

const API_BASE_URL = "http://127.0.0.1:8000";

const edgeTypes = {
  floating: FloatingEdge,
};

const nodeTypes = {
  ceoNode: CEONodeWithPlusIcon,
  agentNode: AgentNodeWithControls,
};

const baseNodeStyle = {
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
};

const colorPalette = [
  "#9333EA", "#EA580C", "#DC2626", "#0EA5E9", "#F59E42", 
  "#059669", "#7C3AED", "#BE185D", "#0891B2", "#CA8A04"
];

function CExecutivePage() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isAddAgentModalOpen, setIsAddAgentModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);

  // Build nodes and edges from API data
  const buildNodesAndEdges = useCallback(async (cexecutiveData) => {
    const newNodes = [];
    const newEdges = [];

    // Fetch CEO agent details
    let ceoAgentDetails = null;
    try {
      const ceoResponse = await fetch(`${API_BASE_URL}/agents/${cexecutiveData.ceo_agent.id}`);
      if (ceoResponse.ok) {
        ceoAgentDetails = await ceoResponse.json();
        console.log(`Fetched CEO agent details:`, ceoAgentDetails);
      }
    } catch (err) {
      console.warn(`Failed to fetch CEO agent details:`, err);
    }

    // Create CEO node with dynamic data
    const ceoNode = {
      id: cexecutiveData.ceo_agent.id,
      type: "ceoNode",
      position: { x: 300, y: 200 },
      data: {
        label: ceoAgentDetails?.name?.replace('_agent', '').toUpperCase() || 
               ceoAgentDetails?.agent_data?.name?.replace('_agent', '').toUpperCase() || "CEO",
        name: ceoAgentDetails?.name || ceoAgentDetails?.agent_data?.agent_name,
        role: ceoAgentDetails?.role || ceoAgentDetails?.agent_data?.role,
        backstory: ceoAgentDetails?.backstory || ceoAgentDetails?.agent_data?.backstory,
        verbose: ceoAgentDetails?.verbose || ceoAgentDetails?.agent_data?.verbose,
        ceoId: cexecutiveData.ceo_agent.id,
        onAddAgent: null,
      },
      style: { ...baseNodeStyle },
    };
    newNodes.push(ceoNode);

    console.log('CEO Agent ID:', cexecutiveData.ceo_agent.id);
    console.log('Connected Agents:', cexecutiveData.connected_agents);

    // Filter out the CEO agent from connected agents
    // The connected_agents array includes the CEO itself, so we need to exclude it
    const nonCeoConnectedAgents = cexecutiveData.connected_agents?.filter(
      agent => agent.id !== cexecutiveData.ceo_agent.id
    ) || [];
    
    console.log('Non-CEO Connected Agents:', nonCeoConnectedAgents);

    // Only create agent nodes if there are non-CEO connected agents
    if (nonCeoConnectedAgents.length > 0) {
      const radius = 200;
      const angleStep = (2 * Math.PI) / nonCeoConnectedAgents.length;

      for (let i = 0; i < nonCeoConnectedAgents.length; i++) {
        const agentInfo = nonCeoConnectedAgents[i];
        const angle = i * angleStep;
        const x = 300 + radius * Math.cos(angle);
        const y = 200 + radius * Math.sin(angle);

        // Try to fetch detailed agent info
        let agentDetails = null;
        try {
          const agentResponse = await fetch(`${API_BASE_URL}/agents/${agentInfo.id}`);
          if (agentResponse.ok) {
            agentDetails = await agentResponse.json();
            console.log(`Fetched agent details for ${agentInfo.id}:`, agentDetails);
          }
        } catch (err) {
          console.warn(`Failed to fetch details for agent ${agentInfo.id}:`, err);
        }

        const agentNode = {
          id: agentInfo.id,
          type: "agentNode",
          position: { x, y },
          data: {
            label: agentDetails?.name?.replace('_agent', '').toUpperCase() || 
                   agentDetails?.agent_data?.name?.replace('_agent', '').toUpperCase() || 
                   `Agent ${i + 1}`,
            name: agentDetails?.name || 
                  agentDetails?.agent_data?.agent_name || 
                  `agent_${agentInfo.id}`,
            role: agentDetails?.role || 
                  agentDetails?.agent_data?.role || 
                  "AI Assistant",
            goal: agentDetails?.goal || 
                  agentDetails?.agent_data?.goal || 
                  "Assist with assigned tasks",
            backstory: agentDetails?.backstory || 
                      agentDetails?.agent_data?.backstory || 
                      ["AI assistant ready to help"],
            verbose: agentDetails?.verbose !== undefined ? 
                    agentDetails.verbose : 
                    (agentDetails?.agent_data?.verbose !== undefined ? 
                     agentDetails.agent_data.verbose : true),
            background: colorPalette[i % colorPalette.length],
            nodeId: agentInfo.id,
            onRemoveAgent: null,
          },
        };
        newNodes.push(agentNode);

        // Create edge from CEO to agent
        const edge = {
          id: `e-${cexecutiveData.ceo_agent.id}-${agentInfo.id}`,
          source: cexecutiveData.ceo_agent.id,
          target: agentInfo.id,
          type: "floating",
          markerEnd: { type: MarkerType.Arrow },
        };
        newEdges.push(edge);
      }
    }

    console.log('Final nodes:', newNodes);
    console.log('Final edges:', newEdges);

    setNodes(newNodes);
    setEdges(newEdges);
  }, [setNodes, setEdges]);

  // Initialize default structure if API fails
  const initializeDefaultStructure = useCallback(() => {
    const defaultNodes = [
      {
        id: "default-ceo",
        type: "ceoNode",
        position: { x: 300, y: 200 },
        data: {
          label: "CEO",
          name: "CEO_agent",
          role: "Chief Executive Officer specializing in organizational vision and strategic decision-making",
          goal: "Lead the organization with vision and integrity.",
          backstory: ["Seasoned CEO with over 20 years of executive leadership experience."],
          verbose: true,
          onAddAgent: null,
        },
        style: { ...baseNodeStyle },
      }
    ];
    setNodes(defaultNodes);
    setEdges([]);
  }, [setNodes, setEdges]);

  // Fetch C-Executive structure from API
  const fetchCExecutiveStructure = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/cexecutive`);
      if (!response.ok) {
        throw new Error('Failed to fetch C-Executive structure');
      }
      const data = await response.json();

      await buildNodesAndEdges(data);
    } catch (err) {
      console.error('Error fetching C-Executive structure:', err);
      setError(err.message);
      initializeDefaultStructure();
    } finally {
      setLoading(false);
    }
  }, [buildNodesAndEdges, initializeDefaultStructure]);

  // Load data on component mount
  useEffect(() => {
    fetchCExecutiveStructure();
  }, [fetchCExecutiveStructure]);

  // Handle adding a new agent
  const handleAddAgent = useCallback(() => {
    setIsAddAgentModalOpen(true);
  }, []);

  const handleAddAgentSubmit = useCallback(async (agentData) => {
    try {
      let agentId = agentData.id; // Use id from Quick Template if present

      if (!agentId) {
        // Create new agent
        const createAgentResponse = await fetch(`${API_BASE_URL}/agents`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: agentData.name,
            role: agentData.role,
            goal: agentData.goal,
            backstory: Array.isArray(agentData.backstory) ? agentData.backstory.join('\n') : agentData.backstory,
            verbose: true,
          }),
        });

        if (!createAgentResponse.ok) {
          throw new Error('Failed to create agent');
        }

        const newAgent = await createAgentResponse.json();
        agentId = newAgent.agent.id;
      }

      // Add agent to CEO's connected agents
      const addAgentResponse = await fetch(`${API_BASE_URL}/cexecutive/add-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: agentId
        }),
      });

      if (!addAgentResponse.ok) {
        throw new Error('Failed to add agent to CEO');
      }

      // Refresh the structure
      await fetchCExecutiveStructure();
      setIsAddAgentModalOpen(false);
    } catch (err) {
      console.error('Error adding agent:', err);
      setError(`Failed to add agent: ${err.message}`);
    }
  }, [fetchCExecutiveStructure]);

  // Handle removing an agent
  const handleRemoveAgent = useCallback(async (agentId) => {
    try {
      const removeAgentResponse = await fetch(`${API_BASE_URL}/cexecutive/remove-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: agentId
        }),
      });

      if (!removeAgentResponse.ok) {
        throw new Error('Failed to remove agent from CEO');
      }

      // Refresh the structure
      await fetchCExecutiveStructure();
      if (selectedNode && selectedNode.id === agentId) {
        setSelectedNode(null);
      }
    } catch (err) {
      console.error('Error removing agent:', err);
      setError(`Failed to remove agent: ${err.message}`);
    }
  }, [selectedNode, fetchCExecutiveStructure]);

  // Update nodes with callback functions
  const nodesWithCallbacks = nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      onAddAgent: node.type === "ceoNode" ? handleAddAgent : node.data.onAddAgent,
      onRemoveAgent: node.type === "agentNode" ? handleRemoveAgent : node.data.onRemoveAgent,
    },
  }));

  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: "floating",
            markerEnd: { type: MarkerType.Arrow },
          },
          eds
        )
      ),
    [setEdges]
  );

  const fetchAgentById = async (agentId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/agents/${agentId}`);
      if (!response.ok) throw new Error('Failed to fetch agent');
      return await response.json();
    } catch (err) {
      console.error('Error fetching agent:', err);
      return null;
    }
  };

  const onNodeClick = useCallback(async (event, node) => {
    setSelectedNode(node);
    // Only fetch if not CEO node
    if (node.type === "agentNode" || node.type === "ceoNode") {
      const agentData = await fetchAgentById(node.id);
      setSelectedAgent(agentData);
    } else {
      setSelectedAgent(null);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    fetchCExecutiveStructure();
  }, [fetchCExecutiveStructure]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading C-Executive structure...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 mx-4 mt-4">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      <div className="flex-1 flex">
        <div className="flex-1 relative">
          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            className="absolute top-4 right-4 z-10 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-sm"
          >
            Refresh
          </button>
          
          <ReactFlow
            nodes={nodesWithCallbacks}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            fitView
            edgeTypes={edgeTypes}
            nodeTypes={nodeTypes}
            connectionLineComponent={FloatingConnectionLine}
          >
            <MiniMap />
            <Controls />
            <Background gap={16} />
          </ReactFlow>
        </div>
        {selectedNode && (
          <RightContextMenu
            node={selectedNode}
            agent={selectedAgent}
            onUpdateAgent={async (agentId, updatedData) => {
              try {
                const response = await fetch(`${API_BASE_URL}/agent/${agentId}/update`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(updatedData),
                });
                if (!response.ok) throw new Error('Failed to update agent');
                await fetchCExecutiveStructure();
              } catch (err) {
                setError(`Failed to update agent: ${err.message}`);
              }
            }}
          />
        )}
      </div>
      
      <AddAgentModal
        isOpen={isAddAgentModalOpen}
        onClose={() => setIsAddAgentModalOpen(false)}
        onAddAgent={handleAddAgentSubmit}
        ceoId={nodes.find(n => n.type === "ceoNode")?.id}
      />
    </div>
  );
}

export default CExecutivePage;