import Peer, { DataConnection } from 'peerjs';
import { useGameStore, User } from '../store/gameStore';
import { Token } from '@thecompany/shared-types';
import { diceService } from './diceService';

export type NetworkEvent = 
  | { type: 'LOGIN_REQUEST'; payload: { username: string; password?: string } }
  | { type: 'LOGIN_RESPONSE'; payload: { success: boolean; error?: string; user?: User } }
  | { type: 'SYNC_STATE'; payload: { tokens: Token[], map: any, users: User[] } }
  | { type: 'TOKEN_MOVE'; payload: Token }
  | { type: 'TOKEN_DELETE'; payload: { tokenId: string } }
  | { type: 'MAP_UPDATE'; payload: any }
  | { type: 'CHAT_MESSAGE'; payload: { sender: string, content: string, type: 'text' | 'roll', timestamp: number } }
  | { type: 'DICE_ROOM_CONFIG'; payload: { slug: string, passcode?: string } }
  | { type: 'DICE_ROLL'; payload: any };

class NetworkService {
  private peer: Peer | null = null;
  private connections: DataConnection[] = [];
  public hostId: string = '';
  public isHost: boolean = false;
  
  // Callback para quando precisar de autenticação na UI (Client side)
  public onAuthRequired: (() => void) | null = null;
  public onAuthSuccess: (() => void) | null = null;
  public onAuthError: ((msg: string) => void) | null = null;

  // Inicializa como HOST
  public async startHost(): Promise<string> {
    this.isHost = true;
    this.peer = new Peer();

    return new Promise((resolve, reject) => {
      this.peer?.on('open', (id) => {
        this.hostId = id;
        console.log('Host initialized with ID:', id);
        resolve(id);
      });

      this.peer?.on('connection', (conn) => {
        console.log('New peer connected:', conn.peer);
        this.handleConnection(conn);
      });

      this.peer?.on('error', (err) => reject(err));
    });
  }

  // Conecta como CLIENTE a um Host existente
  public async joinSession(hostId: string): Promise<void> {
    this.isHost = false;
    this.peer = new Peer();

    return new Promise((resolve, reject) => {
      this.peer?.on('open', () => {
        if (!this.peer) return;
        const conn = this.peer.connect(hostId);
        
        conn.on('open', () => {
          console.log('Connected to host:', hostId);
          this.handleConnection(conn);
          // Cliente conectado, agora espera o prompt de login
          if (this.onAuthRequired) this.onAuthRequired();
          resolve();
        });

        conn.on('error', (err) => reject(err));
      });

      this.peer?.on('error', (err) => reject(err));
    });
  }

  // Envia credenciais para o Host
  public sendLogin(username: string, password?: string) {
    if (!this.connections[0]) return;
    this.connections[0].send({ 
        type: 'LOGIN_REQUEST', 
        payload: { username, password } 
    });
  }

  private handleConnection(conn: DataConnection) {
    this.connections.push(conn);

    // Host NÃO manda mais SYNC_STATE aqui. Espera LOGIN_REQUEST.

    conn.on('data', (data: any) => {
      this.handleMessage(data, conn);
      
      // Se sou Host, retransmito mensagens de JOGO (não de LOGIN)
      if (this.isHost && data.type !== 'LOGIN_REQUEST') {
        this.broadcast(data, conn.peer); 
      }
    });

    conn.on('close', () => {
      this.connections = this.connections.filter(c => c.peer !== conn.peer);
    });
  }

  private handleMessage(message: NetworkEvent, conn: DataConnection) {
    const store = useGameStore.getState();

    switch (message.type) {
      case 'LOGIN_REQUEST':
        if (this.isHost) {
            this.handleLoginRequest(message.payload, conn);
        }
        break;

      case 'LOGIN_RESPONSE':
        if (!this.isHost) {
            if (message.payload.success && message.payload.user) {
                store.setCurrentUser(message.payload.user);
                if (this.onAuthSuccess) this.onAuthSuccess();
            } else {
                if (this.onAuthError) this.onAuthError(message.payload.error || 'Login Failed');
            }
        }
        break;

      case 'SYNC_STATE':
        store.setTokens(message.payload.tokens);
        if (message.payload.map) store.setMap(message.payload.map);
        if (message.payload.users) store.setUsers(message.payload.users);
        break;

      case 'TOKEN_MOVE':
        store.updateToken(message.payload);
        break;
      
      case 'TOKEN_DELETE':
        store.removeToken(message.payload.tokenId);
        break;

      case 'MAP_UPDATE':
        store.setMap(message.payload);
        break;

      case 'DICE_ROOM_CONFIG':
        store.setDiceRoom(message.payload);
        break;

      case 'DICE_ROLL':
         // Replay remote roll locally (triggers Overlay)
         diceService.replayRoll(message.payload);
         break;

      case 'CHAT_MESSAGE':
        store.addChatMessage(message.payload);
        break;

      default:
        console.warn('Unknown message type:', message);
    }
  }

  // Lógica de Validação do Host
  private handleLoginRequest(payload: { username: string, password?: string }, conn: DataConnection) {
     const store = useGameStore.getState();
     // Procura usuário
     const user = store.users.find(u => u.username === payload.username);
     
     if (!user) {
         conn.send({ type: 'LOGIN_RESPONSE', payload: { success: false, error: 'User not found' }});
         return;
     }

     // Valida senha (Se houver)
     if (user.password && user.password !== payload.password) {
         conn.send({ type: 'LOGIN_RESPONSE', payload: { success: false, error: 'Invalid password' }});
         return;
     }

     // Sucesso!
     console.log(`User ${user.username} authenticated!`);
     conn.send({ type: 'LOGIN_RESPONSE', payload: { success: true, user }});

     // Envia Estado do Jogo
     conn.send({ 
       type: 'SYNC_STATE', 
       payload: { 
         tokens: store.tokens,
         map: store.map,
         users: store.users
       } 
     });
  }

  public broadcast(message: NetworkEvent, excludePeerId?: string) {
    this.connections.forEach(conn => {
      if (conn.peer !== excludePeerId) {
        conn.send(message);
      }
    });
  }

  public sendMove(token: Token) {
     const message: NetworkEvent = { type: 'TOKEN_MOVE', payload: token };
     useGameStore.getState().updateToken(token);
     this.broadcast(message);
  }

  public broadcastTokenDelete(tokenId: string) {
    const message: NetworkEvent = { type: 'TOKEN_DELETE', payload: { tokenId } };
    useGameStore.getState().removeToken(tokenId);
    this.broadcast(message);
  }

  public broadcastMapUpdate(mapState: any) {
    const message: NetworkEvent = { type: 'MAP_UPDATE', payload: mapState };
    useGameStore.getState().setMap(mapState);
    this.broadcast(message);
  }

  public broadcastUserList(users: any[]) {
      const message: NetworkEvent = { 
          type: 'SYNC_STATE', 
          payload: { 
              tokens: useGameStore.getState().tokens, // Send everything to be safe, or just users if we optimize SYNC_STATE
              users: users,
              map: useGameStore.getState().map
          } 
      };
      this.broadcast(message);
  }
}

export const network = new NetworkService();