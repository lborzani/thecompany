import { Stage, Layer, RegularPolygon } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import { generateHexGrid, hexToPixel, HEX_SIZE } from '../../utils/hexGrid';
import { TokenComponent } from './TokenComponent';
import { MapLayer } from './MapLayer';
import { TokenContextMenu } from './TokenContextMenu';
import { Token } from '@thecompany/shared-types';

export const GameCanvas = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<{ tokenId: string; x: number; y: number } | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const tokens = useGameStore(state => state.tokens);

  // Use ResizeObserver to track actual container dimensions
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      setCanvasSize({ width: el.clientWidth, height: el.clientHeight });
    };
    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Generate Hex Grid data once
  const hexes = useMemo(() => generateHexGrid(30, 20), []);

  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = e.target.getStage();
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

    setStageScale(newScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  const handleContextMenu = useCallback((e: KonvaEventObject<PointerEvent>, token: Token) => {
      setContextMenu({
          tokenId: token.id,
          x: e.evt.clientX,
          y: e.evt.clientY
      });
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full absolute inset-0">
      <Stage
        width={canvasSize.width}
        height={canvasSize.height}
        onWheel={handleWheel}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        draggable
        className="bg-neutral-800"
        onContextMenu={(e) => e.evt.preventDefault()}
      >
        <MapLayer />
        <Layer>
          {/* Render Hex Grid */}
          {hexes.map((hex) => {
              const { x, y } = hexToPixel(hex.q, hex.r);
              return (
                  <RegularPolygon
                      key={`${hex.q}-${hex.r}`}
                      x={x}
                      y={y}
                      sides={6}
                      radius={HEX_SIZE}
                      stroke="#555"
                      strokeWidth={2}
                      rotation={30} // Pointy top
                  />
              );
          })}

          {/* Tokens with Animation & Logic */}
          {tokens.map((token) => (
            <TokenComponent 
              key={token.id} 
              token={token} 
              onContextMenu={handleContextMenu}
            />
          ))}
        </Layer>
      </Stage>
      {contextMenu && (
          <TokenContextMenu 
              tokenId={contextMenu.tokenId}
              position={{ x: contextMenu.x, y: contextMenu.y }}
              onClose={() => setContextMenu(null)}
          />
      )}
    </div>
  );
};
