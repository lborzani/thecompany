export const HEX_SIZE = 60;
export const HEX_WIDTH = Math.sqrt(3) * HEX_SIZE;
export const HEX_HEIGHT = 2 * HEX_SIZE;

interface Point {
  x: number;
  y: number;
}

interface Hex {
  q: number; // axial coordinates
  r: number;
}

// Convert Axial coords (q,r) to Pixel coords (x,y)
// Pointy-top hex orientation
export function hexToPixel(q: number, r: number): Point {
  const x = HEX_SIZE * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const y = HEX_SIZE * ((3 / 2) * r);
  return { x, y };
}

// Convert Pixel coords (x,y) to Hex Axial coords (q,r)
export function pixelToHex(x: number, y: number): Hex {
  const q = ((Math.sqrt(3) / 3) * x - (1 / 3) * y) / HEX_SIZE;
  const r = ((2 / 3) * y) / HEX_SIZE;
  return hexRound(q, r);
}

// Round floating point hex coordinates to nearest integer hex
function hexRound(q: number, r: number): Hex {
  let s = -q - r;
  
  let rq = Math.round(q);
  let rr = Math.round(r);
  let rs = Math.round(s);

  const q_diff = Math.abs(rq - q);
  const r_diff = Math.abs(rr - r);
  const s_diff = Math.abs(rs - s);

  if (q_diff > r_diff && q_diff > s_diff) {
    rq = -rr - rs;
  } else if (r_diff > s_diff) {
    rr = -rq - rs;
  } else {
    rs = -rq - rr;
  }

  return { q: rq, r: rr };
}

// Helper to generate a grid of hexes (axial coords) within a radius or bounds
// For simplicity, let's generate a rectangular-ish shape using axial coordinates
export function generateHexGrid(cols: number, rows: number): Hex[] {
  const hexes: Hex[] = [];
  for (let r = 0; r < rows; r++) {
    const r_offset = Math.floor(r / 2); // or -Math.floor(r/2) depending on offset
    for (let q = -r_offset; q < cols - r_offset; q++) {
        hexes.push({ q, r });
    }
  }
  return hexes;
}

// Helper: Snap pixel position to nearest hex center
export function snapToGrid(x: number, y: number): Point {
    const hex = pixelToHex(x, y);
    return hexToPixel(hex.q, hex.r);
}