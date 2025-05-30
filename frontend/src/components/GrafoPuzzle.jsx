import { useEffect, useState, useRef } from "react";
import { Puzzle } from "lucide-react";
import React from "react";

function GrafoPuzzle({ nodes = [], edges = [] }) {
  const [layoutNodes, setLayoutNodes] = useState([]);
  const containerRef = useRef(null);


  const createForceLayout = (nodes, edges) => {
    if (nodes.length === 0) return [];

    const containerWidth = 800; 
    const containerHeight = 700;  
    const nodeRadius = 40;

    // Inicializar posiciones aleatorias
    let positions = nodes.map((node, i) => ({
      ...node,
      x: Math.random() * (containerWidth - 100) + 50,
      y: Math.random() * (containerHeight - 100) + 50,
      vx: 0,
      vy: 0
    }));

    // Algoritmo de fuerzas simplificado
    for (let iteration = 0; iteration < 500; iteration++) { // Más iteraciones para mejor separación
      // Fuerza de repulsión entre todos los nodos
      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const dx = positions[j].x - positions[i].x;
          const dy = positions[j].y - positions[i].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 180) { // Distancia mínima entre nodos aumentada
            const force = (180 - distance) * 0.15; // Fuerza aumentada
            const angle = Math.atan2(dy, dx);
            
            positions[i].vx -= Math.cos(angle) * force;
            positions[i].vy -= Math.sin(angle) * force;
            positions[j].vx += Math.cos(angle) * force;
            positions[j].vy += Math.sin(angle) * force;
          }
        }
      }

      // Fuerza de atracción para nodos conectados
      edges.forEach(edge => {
        const sourceIdx = positions.findIndex(n => n.id === edge.source);
        const targetIdx = positions.findIndex(n => n.id === edge.target);
        
        if (sourceIdx !== -1 && targetIdx !== -1) {
          const dx = positions[targetIdx].x - positions[sourceIdx].x;
          const dy = positions[targetIdx].y - positions[sourceIdx].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 150) { // Distancia ideal entre nodos conectados aumentada
            const force = (distance - 150) * 0.03; // Fuerza reducida para menos atracción
            const angle = Math.atan2(dy, dx);
            
            positions[sourceIdx].vx += Math.cos(angle) * force;
            positions[sourceIdx].vy += Math.sin(angle) * force;
            positions[targetIdx].vx -= Math.cos(angle) * force;
            positions[targetIdx].vy -= Math.sin(angle) * force;
          }
        }
      });

      // Aplicar velocidades y fricción
      positions.forEach(pos => {
        pos.x += pos.vx;
        pos.y += pos.vy;
        pos.vx *= 0.8; // Fricción
        pos.vy *= 0.8;

        // Mantener dentro de los límites
        pos.x = Math.max(nodeRadius, Math.min(containerWidth - nodeRadius, pos.x));
        pos.y = Math.max(nodeRadius, Math.min(containerHeight - nodeRadius, pos.y));
      });
    }

    return positions;
  };

  const createCircularLayout = (nodes) => {
    const centerX = 400;
    const centerY = 350;
    const radius = Math.max(120, Math.min(250, nodes.length * 32));
    const angleStep = (2 * Math.PI) / nodes.length;
    return nodes.map((node, i) => ({
      ...node,
      x: centerX + radius * Math.cos(i * angleStep - Math.PI / 2),
      y: centerY + radius * Math.sin(i * angleStep - Math.PI / 2),
    }));
  };

  useEffect(() => {
    console.log('Procesando layout para nodos:', nodes.length);
    console.log('Nodos recibidos:', nodes);
    
    if (nodes.length === 0) {
      setLayoutNodes([]);
      return;
    }


    if (nodes.length <= 15) {
      setLayoutNodes(createCircularLayout(nodes));
    } else {
      const positionedNodes = createForceLayout(nodes, edges);
      setLayoutNodes(positionedNodes);
    }
  }, [nodes, edges]);

  const calculateTextOffset = (sourceNode, targetNode) => {
    const dx = targetNode.x - sourceNode.x;
    const dy = targetNode.y - sourceNode.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) return { offsetX: 0, offsetY: 0 };

    const offsetDistance = 60; 
    const offsetX = -dy / length * offsetDistance;
    const offsetY = dx / length * offsetDistance;

    return { offsetX, offsetY };
  };

  const isReversedEdge = (source, target) => {
    return edges.some(e => e.source === target && e.target === source);
  };

  const edgeElements = edges.map((edge, idx) => {
    const sourceNode = layoutNodes.find(n => n.id === edge.source);
    const targetNode = layoutNodes.find(n => n.id === edge.target);

    if (!sourceNode || !targetNode) {
      console.log(`Edge ${idx}: No se encontró nodo source ${edge.source} o target ${edge.target}`);
      return null;
    }

    const { x: x1, y: y1 } = sourceNode;
    const { x: x2, y: y2 } = targetNode;

   
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) return null;
    
    const radius = 40;
    const startX = x1 + (dx / length) * radius;
    const startY = y1 + (dy / length) * radius;
    const endX = x2 - (dx / length) * radius;
    const endY = y2 - (dy / length) * radius;

    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    const { offsetX, offsetY } = calculateTextOffset(sourceNode, targetNode);

    // Usar curva si hay una conexión reversa
    const useCurve = isReversedEdge(edge.source, edge.target);
    const curvature = useCurve ? length * 0.3 : 0;
    
    const path = useCurve
      ? `M${startX},${startY} Q${midX + curvature * (-dy/length)},${midY + curvature * (dx/length)} ${endX},${endY}`
      : `M${startX},${startY} L${endX},${endY}`;

    return (
      <g key={`edge-${idx}`}>
        <path
          d={path}
          stroke="#10B981"
          strokeWidth="2"
          fill="none"
          markerEnd="url(#arrowhead)"
        />
        <text
          x={midX + offsetX}
          y={midY + offsetY}
          fill="#059669"
          fontSize="12"
          fontWeight="bold"
          textAnchor="middle"
          style={{
            filter: 'drop-shadow(1px 1px 2px rgba(255,255,255,0.8))',
            pointerEvents: 'none'
          }}
        >
          {edge.label && `${edge.label} - `}{`${edge.source} → ${edge.target}`}
        </text>
      </g>
    );
  });

  // Calcula el bounding box de los nodos para ajustar el viewBox del SVG
  const getGraphBoundingBox = (nodes, padding = 60) => {
    if (nodes.length === 0) return { minX: 0, minY: 0, width: 800, height: 700 };
    const xs = nodes.map(n => n.x);
    const ys = nodes.map(n => n.y);
    const minX = Math.min(...xs) - padding;
    const maxX = Math.max(...xs) + padding;
    const minY = Math.min(...ys) - padding;
    const maxY = Math.max(...ys) + padding;
    return {
      minX,
      minY,
      width: maxX - minX,
      height: maxY - minY
    };
  };

  const boundingBox = getGraphBoundingBox(layoutNodes);

  return (
    <div style={{ 
      width: '100%', 
      height: '700px', // Altura aumentada 
      border: '2px solid #e5e7eb', 
      borderRadius: '8px',
      backgroundColor: '#f9fafb',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {layoutNodes.length > 0 ? (
        <div style={{ width: '100%', height: '100%', position: 'relative' }} ref={containerRef}>
          <svg
            width="100%"
            height="100%"
            style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
            viewBox={`${boundingBox.minX} ${boundingBox.minY} ${boundingBox.width} ${boundingBox.height}`}
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#10B981" />
              </marker>
            </defs>
            {edgeElements}
          </svg>
          {layoutNodes.map((node, index) => (
            <div
              key={node.id}
              style={{
                position: 'absolute',
                left: `calc(${((node.x - boundingBox.minX) / boundingBox.width) * 100}% - 40px)`,
                top: `calc(${((node.y - boundingBox.minY) / boundingBox.height) * 100}% - 40px)`,
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: '#3B82F6',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                zIndex: 2,
                border: '3px solid white',
                textAlign: 'center',
                lineHeight: '1.2'
              }}
              title={node.label}
            >
              <div style={{
                width: '100%',
                wordBreak: 'break-word',
                whiteSpace: 'normal'
              }}>
                {node.id}
              </div>
            </div>
          ))}
          {/* Información de debug */}
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 3
          }}>
            Nodos: {layoutNodes.length} | Conexiones: {edges.length}
          </div>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#6b7280'
        }}>
          <Puzzle size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <p style={{ margin: 0, fontSize: '16px' }}>
            Selecciona un puzzle para ver su visualización
          </p>
        </div>
      )}
    </div>
  );
}

export default GrafoPuzzle;