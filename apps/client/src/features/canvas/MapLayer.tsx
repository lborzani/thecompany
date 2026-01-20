import { Layer, Image as KonvaImage } from 'react-konva';
import { useGameStore } from '../../store/gameStore';
import { useEffect, useState } from 'react';

export const MapLayer = () => {
    const mapState = useGameStore(state => state.map);
    const [image, setImage] = useState<HTMLImageElement | null>(null);

    useEffect(() => {
        if (!mapState.imageUrl) {
            setImage(null);
            return;
        }

        const img = new Image();
        img.src = mapState.imageUrl;
        img.onload = () => {
            setImage(img);
        };
    }, [mapState.imageUrl]);

    if (!image) return null;

    return (
        <Layer>
            <KonvaImage 
                image={image}
                x={mapState.offset.x}
                y={mapState.offset.y}
                scaleX={mapState.scale}
                scaleY={mapState.scale}
                listening={false} // Imagem de fundo não deve bloquear cliques
            />
        </Layer>
    );
};