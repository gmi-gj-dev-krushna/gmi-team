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

const edgeTypes = {
  floating: FloatingEdge,
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
    type: "default",
    position: { x: 300, y: 200 },
    data: { label: "CEO" },
    style: { ...baseNodeStyle },
  },
  {
    id: "cfo",
    position: { x: 100, y: 50 },
    data: { label: "CFO" },
    style: { ...baseNodeStyle, background: "#4F46E5" },
  },
  {
    id: "cto",
    position: { x: 500, y: 50 },
    data: { label: "CTO" },
    style: { ...baseNodeStyle, background: "#9333EA" },
  },
  {
    id: "cio",
    position: { x: 100, y: 350 },
    data: { label: "CIO" },
    style: { ...baseNodeStyle, background: "#059669" },
  },
  {
    id: "cmo",
    position: { x: 500, y: 350 },
    data: { label: "CMO" },
    style: { ...baseNodeStyle, background: "#EA580C" },
  },
  {
    id: "cdo",
    position: { x: 300, y: 450 },
    data: { label: "CDO" },
    style: { ...baseNodeStyle, background: "#DC2626" },
  },
];

const initialEdges = [
  {
    id: "e-ceo-cfo",
    source: "ceo",
    target: "cfo",
    type: "floating",
    markerEnd: { type: MarkerType.Arrow },
  },
  {
    id: "e-ceo-cto",
    source: "ceo",
    target: "cto",
    type: "floating",
    markerEnd: { type: MarkerType.Arrow },
  },
  {
    id: "e-ceo-cio",
    source: "ceo",
    target: "cio",
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
];

function CExecutivePage() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);

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
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          fitView
          edgeTypes={edgeTypes}
          connectionLineComponent={FloatingConnectionLine}
        >
          <MiniMap />
          <Controls />
          <Background gap={16} />
        </ReactFlow>
      </div>
      {selectedNode && <RightContextMenu node={selectedNode} />}
    </div>
  );
}

export default CExecutivePage;
