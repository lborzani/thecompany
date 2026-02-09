import { DiceRollResult, DiceArg, DiceValue, DiceRoom } from '@thecompany/shared-types';

type RollListener = (roll: DiceRollResult) => void;

class DiceService {
  private listeners: RollListener[] = [];
  private room: DiceRoom | null = null;

  public async initialize(canvas: HTMLCanvasElement): Promise<void> {
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  public async createRoom(): Promise<DiceRoom> {
    this.room = { slug: 'local-room', passcode: 'local' };
    return this.room;
  }

  public async joinRoom(slug: string, passcode?: string): Promise<void> {
    this.room = { slug, passcode };
  }

  public async roll(
    diceArgs: DiceArg[],
    options?: { external_id?: string; modifier?: number }
  ): Promise<void> {
    const values: DiceValue[] = [];
    let totalValue = 0;
    const equationParts: string[] = [];

    diceArgs.forEach(die => {
      const faces = parseInt(die.type.replace('d', ''));
      const result = Math.floor(Math.random() * faces) + 1;

      totalValue += result;
      equationParts.push(die.type);

      values.push({
        value: result,
        type: die.type,
        label: result.toString(),
      });
    });

    const mod = options?.modifier ?? 0;
    totalValue += mod;

    const rollResult: DiceRollResult = {
      uuid: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      equation: equationParts.join('+') + (mod !== 0 ? (mod > 0 ? `+${mod}` : `${mod}`) : ''),
      total_value: totalValue,
      modifier: mod,
      values,
      user: {
        uuid: options?.external_id || 'local-user',
        username: 'Player',
      },
      is_local: true,
      external_id: options?.external_id,
    };

    this.notifyListeners(rollResult);
  }

  public replayRoll(roll: DiceRollResult): void {
    this.notifyListeners(roll);
  }

  private notifyListeners(roll: DiceRollResult): void {
    this.listeners.forEach(cb => cb(roll));
  }

  public onRoll(callback: RollListener): void {
    this.listeners.push(callback);
  }

  public offRoll(callback: RollListener): void {
    this.listeners = this.listeners.filter(cb => cb !== callback);
  }

  public getRoom(): DiceRoom | null {
    return this.room;
  }
}

export const diceService = new DiceService();
