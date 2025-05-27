import { Position, MarkerType } from "@xyflow/react";

// Get the intersection point on the circle's edge
function getNodeIntersection(sourceNode, targetNode) {
  const sourcePos = sourceNode.internals.positionAbsolute;
  const targetPos = targetNode.internals.positionAbsolute;

  const sourceCenter = {
    x: sourcePos.x + sourceNode.measured.width / 2,
    y: sourcePos.y + sourceNode.measured.height / 2,
  };

  const targetCenter = {
    x: targetPos.x + targetNode.measured.width / 2,
    y: targetPos.y + targetNode.measured.height / 2,
  };

  const dx = targetCenter.x - sourceCenter.x;
  const dy = targetCenter.y - sourceCenter.y;
  const angle = Math.atan2(dy, dx);

  const radius = sourceNode.measured.width / 2 - 5; // adjust -5 for padding
  const x = sourceCenter.x + radius * Math.cos(angle);
  const y = sourceCenter.y + radius * Math.sin(angle);

  return { x, y };
}

// Determine the closest side of the node for connecting
function getEdgePosition(node, intersectionPoint) {
  const cx = node.internals.positionAbsolute.x + node.measured.width / 2;
  const cy = node.internals.positionAbsolute.y + node.measured.height / 2;
  const dx = intersectionPoint.x - cx;
  const dy = intersectionPoint.y - cy;

  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (absDx > absDy) {
    return dx > 0 ? Position.Right : Position.Left;
  } else {
    return dy > 0 ? Position.Bottom : Position.Top;
  }
}

// Provide edge params to FloatingEdge/FloatingConnectionLine
export function getEdgeParams(source, target) {
  const sourceIntersectionPoint = getNodeIntersection(source, target);
  const targetIntersectionPoint = getNodeIntersection(target, source);

  const sourcePos = getEdgePosition(source, sourceIntersectionPoint);
  const targetPos = getEdgePosition(target, targetIntersectionPoint);

  return {
    sx: sourceIntersectionPoint.x,
    sy: sourceIntersectionPoint.y,
    tx: targetIntersectionPoint.x,
    ty: targetIntersectionPoint.y,
    sourcePos,
    targetPos,
  };
}

// Example default structure (not required if you're hardcoding nodes)
export function initialElements() {
  const nodes = [];
  const edges = [];
  const center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

  nodes.push({ id: "target", data: { label: "Target" }, position: center });

  for (let i = 0; i < 8; i++) {
    const angle = (i * 2 * Math.PI) / 8;
    const x = 250 * Math.cos(angle) + center.x;
    const y = 250 * Math.sin(angle) + center.y;

    nodes.push({ id: `${i}`, data: { label: "Source" }, position: { x, y } });

    edges.push({
      id: `edge-${i}`,
      source: `${i}`,
      target: "target",
      type: "floating",
      markerEnd: {
        type: MarkerType.Arrow,
      },
    });
  }

  return { nodes, edges };
}
