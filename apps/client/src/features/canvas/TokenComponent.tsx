import { Circle, Group } from 'react-konva';
import { useEffect, useRef, useState } from 'react';
import Konva from 'konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { Token } from '@thecompany/shared-types';
import { snapToGrid } from '../../utils/hexGrid';
import { network } from '../../services/network';
import { useGameStore } from '../../store/gameStore';

interface TokenComponentProps {
  token: Token;
  onContextMenu?: (e: KonvaEventObject<PointerEvent>, token: Token) => void;
}

export const TokenComponent = ({ token, onContextMenu }: TokenComponentProps) => {
  const shapeRef = useRef<Konva.Circle>(null); // Main visible circle
  const groupRef = useRef<Konva.Group>(null); // Wrapper group for dragging
  // Store initial position to prevent React from forcing the position on re-renders
  const initialPos = useRef({ x: token.x, y: token.y });
  
  const updateToken = useGameStore(state => state.updateToken);
  const currentUser = useGameStore(state => state.currentUser);
  
  // Image Loading State
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (token.imageUrl) {
        const img = new Image();
        img.src = token.imageUrl;
        img.onload = () => setImage(img);
        img.onerror = () => setImage(null);
    } else {
        setImage(null);
    }
  }, [token.imageUrl]);
  
  // Permission Logic
  const canMove = currentUser?.isGM || (token.ownerId && token.ownerId === currentUser?.id);

  // Animate to new position when props change (e.g. from server)
  useEffect(() => {
    const node = groupRef.current;
    if (!node) return;
    
    // Se estivermos arrastando este token localmente, não queremos animar
    if (node.isDragging()) return;

    // Transição suave animation
    node.to({
      x: token.x,
      y: token.y,
      duration: 0.2,
      easing: Konva.Easings.EaseOut,
    });
  }, [token.x, token.y]);
  
  return (
    <Group
        ref={groupRef}
        x={initialPos.current.x}
        y={initialPos.current.y}
        draggable={!!canMove}
        onDragStart={() => {
            // Opcional: Efeito visual ao levantar o token
            groupRef.current?.to({
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 0.1
            });
        }}
        onDragEnd={(e) => {
            // 1. Calculate Snapped Position
            const { x, y } = snapToGrid(e.target.x(), e.target.y());
            
            // 2. Animate to snap position immediately (local feedback)
            e.target.to({
                x: x,
                y: y,
                scaleX: 1,
                scaleY: 1,
                duration: 0.1, // Quick snap
                onFinish: () => {
                     // 3. Update Global State (Optimistic) & Server
                     // We update the store AFTER the snap is visually initiated 
                     const newToken = { ...token, x, y };
                     updateToken(newToken);
                     network.sendMove(newToken);
                }
            });
        }}
        onMouseEnter={(e) => {
            const container = e.target.getStage()?.container();
            if (container) {
                container.style.cursor = canMove ? 'move' : 'not-allowed';
            }
        }}
        onMouseLeave={(e) => {
            const container = e.target.getStage()?.container();
            if (container) {
                container.style.cursor = 'default';
            }
        }}
        onContextMenu={(e) => {
            e.evt.preventDefault(); // Prevent native browser menu
            if (onContextMenu) onContextMenu(e, token);
        }}
    >
        <Circle
            ref={shapeRef}
            radius={40}
            fill={token.color}
            fillPriority={image ? 'pattern' : 'color'}
            fillPatternImage={image || undefined}
            fillPatternScale={image ? { x: 80/image.width, y: 80/image.height } : undefined}
            fillPatternRepeat="no-repeat"
            // Start form top-left of the bounding box (-radius, -radius)
            fillPatternX={-40} 
            fillPatternY={-40} 
            
            stroke={canMove ? 'white' : undefined}
            strokeWidth={canMove ? 2 : 0}
            shadowColor="black"
            shadowBlur={10}
            shadowOpacity={0.5}
        />
    </Group>
  );
};
