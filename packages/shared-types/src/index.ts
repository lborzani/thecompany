export interface ServerToClientEvents {
  // Placeholder for server -> client events
  pong: (message: string) => void;
  "token:moved": (token: Token) => void;
  "state:full": (tokens: Token[]) => void;
}

export interface ClientToServerEvents {
  // Placeholder for client -> server events
  ping: () => void;
  "token:move": (token: Token) => void;
  "state:request": () => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
}

// Basic Data Models
export interface Token {
  id: string;
  x: number;
  y: number;
  color: string;
  label?: string;
  ownerId?: string;
  imageUrl?: string;
}
