// ============================================
// SRC/COMPONENTS/Path.tsx — единая дорога карты (1.8.0)
// ============================================
// Один <svg class="map-road"> и один <path class="map-road-line"> с кубическими
// кривыми из MapLayout.buildRoadPath() (T40). Разметка 1:1 с _buildRoad.

export interface PathProps {
    width: number;
    height: number;
    d: string;
}

export function Path({ width, height, d }: PathProps) {
    return (
        <svg className="map-road" viewBox={'0 0 ' + width + ' ' + height} preserveAspectRatio="none">
            <path className="map-road-line" d={d} />
        </svg>
    );
}
