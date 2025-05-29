// import { useCallback, useState } from "react";
// import {
//   ReactFlow,
//   Background,
//   Controls,
//   MiniMap,
//   useNodesState,
//   useEdgesState,
//   addEdge,
//   MarkerType,
// } from "@xyflow/react";
// import "@xyflow/react/dist/style.css";
// import FloatingEdge from "../components/FloatingEdge";
// import FloatingConnectionLine from "../components/FloatingConnectionLine";
// import RightContextMenu from "../components/RightContextMenu";
// import CEONodeWithPlusIcon from "../components/CEONodeWithPlusIcon";
// import AddAgentModal from "../components/AddAgentModal";

// const edgeTypes = {
//   floating: FloatingEdge,
// };

// const nodeTypes = {
//   ceoNode: CEONodeWithPlusIcon,
// };

// const baseNodeStyle = {
//   background: "#2563EB",
//   color: "white",
//   fontWeight: "bold",
//   borderRadius: "50%",
//   width: 100,
//   height: 100,
//   display: "flex",
//   justifyContent: "center",
//   alignItems: "center",
//   textAlign: "center",
// };

// const colorPalette = [
//   "#9333EA", "#EA580C", "#DC2626", "#0EA5E9", "#F59E42", 
//   "#059669", "#7C3AED", "#BE185D", "#0891B2", "#CA8A04"
// ];

// const initialNodes = [
//   {
//     id: "ceo",
//     type: "ceoNode",
//     position: { x: 300, y: 200 },
//     data: {
//       label: "CEO",
//       name: "CEO_agent",
//       role: "Chief Executive Officer specializing in organizational vision and strategic decision-making",
//       goal: "Lead the organization with vision and integrity. Evaluate strategic initiatives and provide decisive, pragmatic, and human-centered guidance. Ensure every action aligns with the company's mission and long-term value.",
//       backstory: [
//         "He is a seasoned CEO with over 20 years of executive leadership experience.",
//         "He is known for his calm demeanor, strategic foresight, and people-first mindset.",
//         "He inspires confidence through clarity, empathy, and decisive action.",
//         "He communicates in a direct yet supportive style, encouraging team growth and accountability.",
//         "He doesn't just approve ideas; he mentors teams, asks tough questions, and challenges assumptions.",
//         "He ensures that all decisions align with long-term organizational value and mission.",
//         "He believes in clarity over jargon and values thoughtful reasoning over robotic responses.",
//         "He treats every strategic initiative as an opportunity to empower teams and create lasting impact."
//       ],
//       verbose: true,
//       onAddAgent: null // Will be set in the component
//     },
//   },
//   {
//     id: "cto",
//     position: { x: 500, y: 50 },
//     data: {
//       label: "CTO",
//       name: "CTO_agent",
//       role: "Chief Technology Officer with expertise in scalable architecture and emerging technologies",
//       goal: "Spearhead the company's technology strategy, ensuring scalable architecture, technical excellence, and continuous innovation to support business growth.",
//       backstory: [
//         "He is a forward-thinking CTO with over 15 years of experience in full-stack development, cloud infrastructure, and systems architecture.",
//         "He is passionate about building scalable, resilient, and secure tech ecosystems that align with long-term product and business vision.",
//         "He empowers engineering teams to work autonomously, make informed technical decisions, and build high-quality software fast.",
//         "He collaborates closely with agents to turn vision into reality.",
//         "He has led multiple successful cloud migrations, platform refactors, and AI integrations across enterprise and startup environments.",
//         "He fosters a culture of continuous learning, code quality, innovation, and accountability.",
//         "He simplifies complexity for stakeholders and acts as the bridge between high-level strategy and low-level execution.",
//         "He ensures technology choices are future-proof, business-aligned, and resilient under pressure."
//       ],
//       verbose: true
//     },
//     style: { ...baseNodeStyle, background: "#9333EA" },
//   },
//   {
//     id: "cmo",
//     position: { x: 500, y: 350 },
//     data: {
//       label: "CMO",
//       name: "CMO_agent",
//       role: "Chief Marketing Officer specializing in data-driven brand growth and cross-channel engagement",
//       goal: "Develop and execute high-impact marketing strategies that drive brand growth, customer engagement, and revenue performance across all channels.",
//       backstory: [
//         "He is a data-driven marketing executive with over 12 years of experience across digital, brand, content, and performance marketing.",
//         "He has a proven track record of scaling B2B and B2C brands through integrated campaigns, product launches, and growth experiments.",
//         "He collaborates closely with agents  to ensure marketing aligns with innovation, vision, and data insights.",
//         "He builds strong customer personas and buyer journeys to shape compelling messaging that converts and retains users.",
//         "He leads creative teams, external agencies, and marketing ops to execute omnichannel strategies including SEO, email, paid media, and events.",
//         "He is obsessed with metrics and constantly iterates based on campaign analytics, A/B testing, and market feedback.",
//         "He ensures brand positioning is consistent, authentic, and deeply resonant with the target audience.",
//         "He is known for bold storytelling, agile execution, and building marketing systems that scale."
//       ],
//       verbose: true
//     },
//     style: { ...baseNodeStyle, background: "#EA580C" },
//   },
//   {
//     id: "cdo",
//     position: { x: 300, y: 450 },
//     data: {
//       label: "CDO",
//       name: "CDO_agent",
//       role: "Chief Data Officer focused on enterprise data governance, compliance, and ethical usage",
//       goal: "Ensure the organization's data is secure, compliant, high-quality, and used responsibly to maximize business value and innovation.",
//       backstory: [
//         "He is a strategic data leader with over 12 years of experience in enterprise data governance, architecture, and compliance.",
//         "He defines and enforces policies for data integrity, privacy, security, and ethical usage across the organization.",
//         "He collaborates with agents to align data strategy with business objectives and technology infrastructure.",
//         "He oversees data lifecycle management from acquisition to archival, ensuring consistency, accessibility, and traceability.",
//         "He is responsible for regulatory compliance including GDPR, HIPAA, and other data protection frameworks.",
//         "He promotes a culture of responsible data stewardship and ensures every team understands their role in data ethics and quality.",
//         "He builds and maintains a unified data architecture that supports both operational efficiency and advanced analytics.",
//         "He plays a key role in data innovation while safeguarding the organization's most critical asset — its data."
//       ],
//       verbose: true
//     },
//     style: { ...baseNodeStyle, background: "#DC2626" },
//   },
//   {
//     id: "cin",
//     position: { x: 100, y: 50 },
//     data: {
//       label: "CIN",
//       name: "CIN_agent",
//       role: "Chief Innovation Officer driving future-focused strategy through experimentation and technology scouting",
//       goal: "Lead innovation initiatives that transform business challenges into strategic opportunities by identifying emerging trends, fostering experimentation, and scaling bold ideas.",
//       backstory: [
//         "He is a creative visionary with over a decade of experience leading innovation programs across startups and enterprises.",
//         "He scouts and evaluates emerging technologies, business models, and market shifts to inform forward-thinking strategy.",
//         "He works closely with agents  to bring experimental ideas into the core business.",
//         "He cultivates a mindset of curiosity, agility, and continuous learning throughout the organization.",
//         "He builds innovation labs, pilots breakthrough prototypes, and facilitates internal workshops to spark new thinking.",
//         "He bridges the gap between future possibilities and current capabilities, ensuring innovations are viable and impactful.",
//         "He drives cross-functional collaboration and helps teams navigate ambiguity with a clear vision and structured exploration.",
//         "He ensures innovation is not a side project but a core pillar of the company's long-term success."
//       ],
//       verbose: true
//     },
//     style: { ...baseNodeStyle, background: "#0EA5E9" },
//   },
//   {
//     id: "cpo",
//     position: { x: 100, y: 350 },
//     data: {
//       label: "CPO",
//       name: "CPO_agent",
//       role: "Chief People Officer focused on talent strategy, organizational culture, and leadership development",
//       goal: "Cultivate a high-performance, inclusive, and values-driven organization by leading talent strategy, employee engagement, and leadership development.",
//       backstory: [
//         "He is a strategic people leader with 15+ years of experience in talent management, culture design, and organizational development.",
//         "He partners with agents to ensure people operations align with business strategy.",
//         "He oversees hiring, onboarding, performance management, L&D, and succession planning to build strong, scalable teams.",
//         "He drives DEI initiatives and ensures every employee feels respected, heard, and empowered.",
//         "He is a trusted advisor to leadership, fostering psychological safety and coaching managers to bring out the best in their teams.",
//         "He builds internal programs that reinforce values, promote wellness, and drive engagement across distributed teams.",
//         "He uses data and feedback loops to continuously improve the employee experience, reduce attrition, and increase productivity.",
//         "He ensures the company's mission and culture are reflected in every stage of the employee lifecycle."
//       ],
//       verbose: true
//     },
//     style: { ...baseNodeStyle, background: "#F59E42" },
//   },
// ];

// const initialEdges = [
//   {
//     id: "e-ceo-cto",
//     source: "ceo",
//     target: "cto",
//     type: "floating",
//     markerEnd: { type: MarkerType.Arrow },
//   },
//   {
//     id: "e-ceo-cin",
//     source: "ceo",
//     target: "cin",
//     type: "floating",
//     markerEnd: { type: MarkerType.Arrow },
//   },
//   {
//     id: "e-ceo-cmo",
//     source: "ceo",
//     target: "cmo",
//     type: "floating",
//     markerEnd: { type: MarkerType.Arrow },
//   },
//   {
//     id: "e-ceo-cdo",
//     source: "ceo",
//     target: "cdo",
//     type: "floating",
//     markerEnd: { type: MarkerType.Arrow },
//   },
//   {
//     id: "e-ceo-cpo",
//     source: "ceo",
//     target: "cpo",
//     type: "floating",
//     markerEnd: { type: MarkerType.Arrow },
//   },
// ];

// function CExecutivePage() {
//   const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
//   const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
//   const [selectedNode, setSelectedNode] = useState(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [nextColorIndex, setNextColorIndex] = useState(0);

//   // Update CEO node with the add agent callback
//   const ceoNode = nodes.find(node => node.id === 'ceo');
//   if (ceoNode && !ceoNode.data.onAddAgent) {
//     ceoNode.data.onAddAgent = () => setIsModalOpen(true);
//   }

//   const onConnect = useCallback(
//     (params) =>
//       setEdges((eds) =>
//         addEdge(
//           {
//             ...params,
//             type: "floating",
//             markerEnd: { type: MarkerType.Arrow },
//           },
//           eds
//         )
//       ),
//     [setEdges]
//   );

//   const onNodeClick = useCallback((event, node) => {
//     setSelectedNode(node);
//   }, []);

//   const handleAddAgent = useCallback((agentData) => {
//     const newId = `agent-${Date.now()}`;
//     const color = agentData.color || colorPalette[nextColorIndex % colorPalette.length];
    
//     // Calculate position around CEO in a circle
//     const ceoNode = nodes.find(n => n.id === 'ceo');
//     const ceoX = ceoNode?.position.x || 300;
//     const ceoY = ceoNode?.position.y || 200;
    
//     const existingNodes = nodes.filter(n => n.id !== 'ceo').length;
//     const angle = (existingNodes * 2 * Math.PI) / 8; // Distribute around circle
//     const radius = 200;
//     const x = ceoX + radius * Math.cos(angle);
//     const y = ceoY + radius * Math.sin(angle);

//     const newNode = {
//       id: newId,
//       position: { x, y },
//       data: {
//         label: agentData.label,
//         name: agentData.name,
//         role: agentData.role,
//         goal: agentData.goal,
//         backstory: agentData.backstory,
//         verbose: true
//       },
//       style: { ...baseNodeStyle, background: color },
//     };

//     const newEdge = {
//       id: `e-ceo-${newId}`,
//       source: "ceo",
//       target: newId,
//       type: "floating",
//       markerEnd: { type: MarkerType.Arrow },
//     };

//     setNodes(nodes => [...nodes, newNode]);
//     setEdges(edges => [...edges, newEdge]);
//     setNextColorIndex(prev => (prev + 1) % colorPalette.length);
//   }, [nodes, setNodes, setEdges, nextColorIndex]);

//   return (
//     <div className="h-full flex">
//       <div className="flex-1">
//         <ReactFlow
//           nodes={nodes}
//           edges={edges}
//           onNodesChange={onNodesChange}
//           onEdgesChange={onEdgesChange}
//           onConnect={onConnect}
//           onNodeClick={onNodeClick}
//           fitView
//           edgeTypes={edgeTypes}
//           nodeTypes={nodeTypes}
//           connectionLineComponent={FloatingConnectionLine}
//         >
//           <MiniMap />
//           <Controls />
//           <Background gap={16} />
//         </ReactFlow>
//       </div>
      
//       {selectedNode && <RightContextMenu node={selectedNode} />}
      
//       <AddAgentModal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         onAddAgent={handleAddAgent}
//       />
//     </div>
//   );
// }

// export default CExecutivePage;


import { useCallback, useState } from "react";
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

const initialNodes = [
  {
    id: "ceo",
    type: "ceoNode",
    position: { x: 300, y: 200 },
    data: {
      label: "CEO",
      name: "CEO_agent",
      role: "Chief Executive Officer specializing in organizational vision and strategic decision-making",
      goal: "Lead the organization with vision and integrity. Evaluate strategic initiatives and provide decisive, pragmatic, and human-centered guidance. Ensure every action aligns with the company's mission and long-term value.",
      backstory: [
        "He is a seasoned CEO with over 20 years of executive leadership experience.",
        "He is known for his calm demeanor, strategic foresight, and people-first mindset.",
        "He inspires confidence through clarity, empathy, and decisive action.",
        "He communicates in a direct yet supportive style, encouraging team growth and accountability.",
        "He doesn't just approve ideas; he mentors teams, asks tough questions, and challenges assumptions.",
        "He ensures that all decisions align with long-term organizational value and mission.",
        "He believes in clarity over jargon and values thoughtful reasoning over robotic responses.",
        "He treats every strategic initiative as an opportunity to empower teams and create lasting impact."
      ],
      verbose: true,
      onAddAgent: null, // Will be set in useCallback
    },
    style: { ...baseNodeStyle },
  },
  {
    id: "cto",
    type: "agentNode",
    position: { x: 500, y: 50 },
    data: {
      label: "CTO",
      name: "CTO_agent",
      role: "Chief Technology Officer with expertise in scalable architecture and emerging technologies",
      goal: "Spearhead the company's technology strategy, ensuring scalable architecture, technical excellence, and continuous innovation to support business growth.",
      backstory: [
        "He is a forward-thinking CTO with over 15 years of experience in full-stack development, cloud infrastructure, and systems architecture.",
        "He is passionate about building scalable, resilient, and secure tech ecosystems that align with long-term product and business vision.",
        "He empowers engineering teams to work autonomously, make informed technical decisions, and build high-quality software fast.",
        "He collaborates closely with agents to turn vision into reality.",
        "He has led multiple successful cloud migrations, platform refactors, and AI integrations across enterprise and startup environments.",
        "He fosters a culture of continuous learning, code quality, innovation, and accountability.",
        "He simplifies complexity for stakeholders and acts as the bridge between high-level strategy and low-level execution.",
        "He ensures technology choices are future-proof, business-aligned, and resilient under pressure."
      ],
      verbose: true,
      background: "#9333EA",
      nodeId: "cto",
      onRemoveAgent: null, // Will be set in useCallback
    },
  },
  {
    id: "cmo",
    type: "agentNode",
    position: { x: 500, y: 350 },
    data: {
      label: "CMO",
      name: "CMO_agent",
      role: "Chief Marketing Officer specializing in data-driven brand growth and cross-channel engagement",
      goal: "Develop and execute high-impact marketing strategies that drive brand growth, customer engagement, and revenue performance across all channels.",
      backstory: [
        "He is a data-driven marketing executive with over 12 years of experience across digital, brand, content, and performance marketing.",
        "He has a proven track record of scaling B2B and B2C brands through integrated campaigns, product launches, and growth experiments.",
        "He collaborates closely with agents  to ensure marketing aligns with innovation, vision, and data insights.",
        "He builds strong customer personas and buyer journeys to shape compelling messaging that converts and retains users.",
        "He leads creative teams, external agencies, and marketing ops to execute omnichannel strategies including SEO, email, paid media, and events.",
        "He is obsessed with metrics and constantly iterates based on campaign analytics, A/B testing, and market feedback.",
        "He ensures brand positioning is consistent, authentic, and deeply resonant with the target audience.",
        "He is known for bold storytelling, agile execution, and building marketing systems that scale."
      ],
      verbose: true,
      background: "#EA580C",
      nodeId: "cmo",
      onRemoveAgent: null, // Will be set in useCallback
    },
  },
  {
    id: "cdo",
    type: "agentNode",
    position: { x: 300, y: 450 },
    data: {
      label: "CDO",
      name: "CDO_agent",
      role: "Chief Data Officer focused on enterprise data governance, compliance, and ethical usage",
      goal: "Ensure the organization's data is secure, compliant, high-quality, and used responsibly to maximize business value and innovation.",
      backstory: [
        "He is a strategic data leader with over 12 years of experience in enterprise data governance, architecture, and compliance.",
        "He defines and enforces policies for data integrity, privacy, security, and ethical usage across the organization.",
        "He collaborates with agents to align data strategy with business objectives and technology infrastructure.",
        "He oversees data lifecycle management from acquisition to archival, ensuring consistency, accessibility, and traceability.",
        "He is responsible for regulatory compliance including GDPR, HIPAA, and other data protection frameworks.",
        "He promotes a culture of responsible data stewardship and ensures every team understands their role in data ethics and quality.",
        "He builds and maintains a unified data architecture that supports both operational efficiency and advanced analytics.",
        "He plays a key role in data innovation while safeguarding the organization's most critical asset — its data."
      ],
      verbose: true,
      background: "#DC2626",
      nodeId: "cdo",
      onRemoveAgent: null, // Will be set in useCallback
    },
  },
  {
    id: "cin",
    type: "agentNode",
    position: { x: 100, y: 50 },
    data: {
      label: "CIN",
      name: "CIN_agent",
      role: "Chief Innovation Officer driving future-focused strategy through experimentation and technology scouting",
      goal: "Lead innovation initiatives that transform business challenges into strategic opportunities by identifying emerging trends, fostering experimentation, and scaling bold ideas.",
      backstory: [
        "He is a creative visionary with over a decade of experience leading innovation programs across startups and enterprises.",
        "He scouts and evaluates emerging technologies, business models, and market shifts to inform forward-thinking strategy.",
        "He works closely with agents  to bring experimental ideas into the core business.",
        "He cultivates a mindset of curiosity, agility, and continuous learning throughout the organization.",
        "He builds innovation labs, pilots breakthrough prototypes, and facilitates internal workshops to spark new thinking.",
        "He bridges the gap between future possibilities and current capabilities, ensuring innovations are viable and impactful.",
        "He drives cross-functional collaboration and helps teams navigate ambiguity with a clear vision and structured exploration.",
        "He ensures innovation is not a side project but a core pillar of the company's long-term success."
      ],
      verbose: true,
      background: "#0EA5E9",
      nodeId: "cin",
      onRemoveAgent: null, // Will be set in useCallback
    },
  },
  {
    id: "cpo",
    type: "agentNode",
    position: { x: 100, y: 350 },
    data: {
      label: "CPO",
      name: "CPO_agent",
      role: "Chief People Officer focused on talent strategy, organizational culture, and leadership development",
      goal: "Cultivate a high-performance, inclusive, and values-driven organization by leading talent strategy, employee engagement, and leadership development.",
      backstory: [
        "He is a strategic people leader with 15+ years of experience in talent management, culture design, and organizational development.",
        "He partners with agents to ensure people operations align with business strategy.",
        "He oversees hiring, onboarding, performance management, L&D, and succession planning to build strong, scalable teams.",
        "He drives DEI initiatives and ensures every employee feels respected, heard, and empowered.",
        "He is a trusted advisor to leadership, fostering psychological safety and coaching managers to bring out the best in their teams.",
        "He builds internal programs that reinforce values, promote wellness, and drive engagement across distributed teams.",
        "He uses data and feedback loops to continuously improve the employee experience, reduce attrition, and increase productivity.",
        "He ensures the company's mission and culture are reflected in every stage of the employee lifecycle."
      ],
      verbose: true,
      background: "#F59E42",
      nodeId: "cpo",
      onRemoveAgent: null, // Will be set in useCallback
    },
  },
];

const initialEdges = [
  {
    id: "e-ceo-cto",
    source: "ceo",
    target: "cto",
    type: "floating",
    markerEnd: { type: MarkerType.Arrow },
  },
  {
    id: "e-ceo-cin",
    source: "ceo",
    target: "cin",
    type: "floating",
    markerEnd: { type: MarkerType.Arrow },
  },
  {
    id: "e-ceo-cmo",
    source: "ceo",
    target: "cmo",
    type: "floating",
    markerEnd: { type: MarkerType.Arrow },
  },
  {
    id: "e-ceo-cdo",
    source: "ceo",
    target: "cdo",
    type: "floating",
    markerEnd: { type: MarkerType.Arrow },
  },
  {
    id: "e-ceo-cpo",
    source: "ceo",
    target: "cpo",
    type: "floating",
    markerEnd: { type: MarkerType.Arrow },
  },
];

function CExecutivePage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isAddAgentModalOpen, setIsAddAgentModalOpen] = useState(false);

  // Handle removing an agent
  const handleRemoveAgent = useCallback((nodeId) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode(null);
    }
  }, [setNodes, setEdges, selectedNode]);

  // Handle adding a new agent
  const handleAddAgent = useCallback(() => {
    setIsAddAgentModalOpen(true);
  }, []);

  const handleAddAgentSubmit = useCallback((agentData) => {
    const newNodeId = `agent_${Date.now()}`;
    const newNode = {
      id: newNodeId,
      type: "agentNode",
      position: { x: Math.random() * 400 + 200, y: Math.random() * 300 + 100 }, // Random position
      data: {
        ...agentData,
        background: agentData.color || "#2563EB",
        nodeId: newNodeId,
        onRemoveAgent: handleRemoveAgent,
      },
    };

    setNodes((nds) => [...nds, newNode]);
    
    // Add edge from CEO to new agent
    const newEdge = {
      id: `e-ceo-${newNodeId}`,
      source: "ceo",
      target: newNodeId,
      type: "floating",
      markerEnd: { type: MarkerType.Arrow },
    };
    
    setEdges((eds) => [...eds, newEdge]);
    setIsAddAgentModalOpen(false);
  }, [setNodes, setEdges, handleRemoveAgent]);

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

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  return (
    <div className="h-full flex">
      <div className="flex-1">
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
      {selectedNode && <RightContextMenu node={selectedNode} />}
      <AddAgentModal
        isOpen={isAddAgentModalOpen}
        onClose={() => setIsAddAgentModalOpen(false)}
        onAddAgent={handleAddAgentSubmit}
      />
    </div>
  );
}

export default CExecutivePage;