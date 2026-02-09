import { Circle, Group, Rect, Text } from 'react-konva';
import { useEffect, useRef, useState } from 'react';
import Konva from 'konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { Token, PathfinderCharacter } from '@thecompany/shared-types';
import { snapToGrid } from '../../utils/hexGrid';
import { network } from '../../services/network';
import { useGameStore } from '../../store/gameStore';
import { calculateMaxHP } from '../../utils/pf2e';

interface TokenComponentProps {
  token: Token;
  onContextMenu?: (e: KonvaEventObject<PointerEvent>, token: Token) => void;
}

const TOKEN_RADIUS = 40;

export const TokenComponent = ({ token, onContextMenu }: TokenComponentProps) => {
  const shapeRef = useRef<Konva.Circle>(null);
  const groupRef = useRef<Konva.Group>(null);
  const initialPos = useRef({ x: token.x, y: token.y });
  
  const updateToken = useGameStore(state => state.updateToken);
  const currentUser = useGameStore(state => state.currentUser);
  const characters = useGameStore(state => state.characters);
  
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  // Find linked character (if any)
  const linkedCharacter: PathfinderCharacter | undefined = token.characterId
    ? characters.find(c => c.id === token.characterId)
    : undefined;

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
  
  const canMove = currentUser?.isGM || (token.ownerId && token.ownerId === currentUser?.id);

  useEffect(() => {
    const node = groupRef.current;
    if (!node) return;
    if (node.isDragging()) return;
    node.to({
      x: token.x,
      y: token.y,
      duration: 0.2,
      easing: Konva.Easings.EaseOut,
    });
  }, [token.x, token.y]);

  // ── HP bar calculations ──────────────────────────
  const hpData = linkedCharacter ? (() => {
    const maxHP = calculateMaxHP(linkedCharacter);
    const currentHP = linkedCharacter.hp.current;
    const ratio = maxHP > 0 ? Math.max(0, Math.min(1, currentHP / maxHP)) : 0;
    const color = ratio > 0.5 ? '#4ade80' : ratio > 0.25 ? '#facc15' : '#f87171';
    return { maxHP, currentHP, ratio, color };
  })() : null;

  // Name to display
  const displayName = linkedCharacter?.name ?? token.label;
  
  return (
    <Group
        ref={groupRef}
        x={initialPos.current.x}
        y={initialPos.current.y}
        draggable={!!canMove}
        onDragStart={() => {
            groupRef.current?.to({
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 0.1
            });
        }}
        onDragEnd={(e) => {
            const { x, y } = snapToGrid(e.target.x(), e.target.y());
            e.target.to({
                x: x,
                y: y,
                scaleX: 1,
                scaleY: 1,
                duration: 0.1,
                onFinish: () => {
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
            e.evt.preventDefault();
            if (onContextMenu) onContextMenu(e, token);
        }}
    >
        {/* Main token circle */}
        <Circle
            ref={shapeRef}
            radius={TOKEN_RADIUS}
            fill={token.color}
            fillPriority={image ? 'pattern' : 'color'}
            fillPatternImage={image || undefined}
            fillPatternScale={image ? { x: 80/image.width, y: 80/image.height } : undefined}
            fillPatternRepeat="no-repeat"
            fillPatternX={-TOKEN_RADIUS} 
            fillPatternY={-TOKEN_RADIUS} 
            
            stroke={canMove ? 'white' : undefined}
            strokeWidth={canMove ? 2 : 0}
            shadowColor="black"
            shadowBlur={10}
            shadowOpacity={0.5}
        />

        {/* HP bar (below token) */}
        {hpData && hpData.maxHP > 0 && (
          <>
            {/* Background bar */}
            <Rect
              x={-TOKEN_RADIUS}
              y={TOKEN_RADIUS + 4}
              width={TOKEN_RADIUS * 2}
              height={6}
              cornerRadius={3}
              fill="#27272a"
              stroke="#3f3f46"
              strokeWidth={1}
            />
            {/* Filled bar */}
            <Rect
              x={-TOKEN_RADIUS}
              y={TOKEN_RADIUS + 4}
              width={TOKEN_RADIUS * 2 * hpData.ratio}
              height={6}
              cornerRadius={3}
              fill={hpData.color}
            />
            {/* HP text */}
            <Text
              x={-TOKEN_RADIUS}
              y={TOKEN_RADIUS + 4}
              width={TOKEN_RADIUS * 2}
              height={6}
              text={`${hpData.currentHP}`}
              fontSize={5}
              fill="white"
              fontStyle="bold"
              align="center"
              verticalAlign="middle"
              listening={false}
            />
          </>
        )}

        {/* Name label (above token) */}
        {displayName && (
          <Text
            x={-TOKEN_RADIUS - 10}
            y={-TOKEN_RADIUS - 16}
            width={TOKEN_RADIUS * 2 + 20}
            text={displayName}
            fontSize={11}
            fill="white"
            fontStyle="bold"
            align="center"
            listening={false}
            shadowColor="black"
            shadowBlur={4}
            shadowOpacity={0.8}
          />
        )}

        {/* Condition dots (small colored dots around token) */}
        {linkedCharacter && linkedCharacter.conditions.length > 0 && (
          linkedCharacter.conditions.slice(0, 6).map((cond, i) => {
            const angle = (i * 60 - 90) * (Math.PI / 180);
            const cx = Math.cos(angle) * (TOKEN_RADIUS + 10);
            const cy = Math.sin(angle) * (TOKEN_RADIUS + 10);
            return (
              <Circle
                key={cond.id}
                x={cx}
                y={cy}
                radius={4}
                fill="#a78bfa"
                stroke="#18181b"
                strokeWidth={1}
                listening={false}
              />
            );
          })
        )}
    </Group>
  );
};
