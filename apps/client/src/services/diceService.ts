// Simple local dice service - no heavy 3D rendering
class DiceService {
  private listeners: ((roll: any) => void)[] = [];

  // No API needed anymore
  constructor() {}

  // Keep signature for compatibility
  public async initialize(canvas: HTMLCanvasElement) {
    console.log("DiceService: Simple Mode Initialized (No 3D)");
    // Clear canvas if needed or just leave it transparent
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // Simulate room creation
  public async createRoom(): Promise<{ slug: string, passcode?: string }> {
      return { slug: "local-room", passcode: "local" };
  }

  // Simulate room join
  public async joinRoom(slug: string, passcode?: string) {
      console.log("DiceService: Joined local virtual room");
  }

  // Generate local random numbers
  public async roll(diceArgs: { theme?: string, type: string }[], options?: { external_id?: string }) {
     console.log("DiceService: Calculating Roll...", diceArgs);

     const values: any[] = [];
     let totalValue = 0;
     const equationParts: string[] = [];

     diceArgs.forEach(die => {
         // Extract faces (e.g. "d20" -> 20)
         const faces = parseInt(die.type.replace('d', ''));
         
         // Secure random number
         const result = Math.floor(Math.random() * faces) + 1;
         
         totalValue += result;
         equationParts.push(die.type);
         
         values.push({
             value: result,
             type: die.type,
             label: result.toString() 
         });
     });

     // Mock DDDice response structure for compatibility
     const rollResult = {
         uuid: crypto.randomUUID(),
         created_at: new Date().toISOString(),
         equation: equationParts.join("+"),
         total_value: totalValue,
         values: values,
         user: {
             // Use external_id passed from ChatPanel or placeholder
             uuid: options?.external_id || "local-user", 
             username: "Player" 
         },
         is_local: true,
         external_id: options?.external_id
     };

     // Instant notify
     this.notifyListeners(rollResult);
  }

  // Allow replaying a roll received from network so Overlay can show it
  public replayRoll(roll: any) {
      this.notifyListeners(roll);
  }
  
  private notifyListeners(roll: any) {
      console.log("ROLL FINISHED (Local)", roll);
      this.listeners.forEach(cb => cb(roll));
  }

  public onRoll(callback: (roll: any) => void) {
      this.listeners.push(callback);
  }

  public offRoll(callback: (roll: any) => void) {
      this.listeners = this.listeners.filter(cb => cb !== callback);
  }
  
  public getRoom() {
      return { slug: "local", passcode: "" };
  }
}

export const diceService = new DiceService();
