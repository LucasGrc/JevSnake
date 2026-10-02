export type Direction = "up" | "down" | "left" | "right";

export type CellState = "libre" | "pared" | "cuerpo";

export interface Coordinates {
  x: number;
  y: number;
}

export interface SemanticNeighbors {
  arriba: CellState;
  abajo: CellState;
  izquierda: CellState;
  derecha: CellState;
}

export interface SemanticSnakeState {
  direccion_actual: string;
  posicion_comida: string;
  vecinos: SemanticNeighbors;
  resumen_situacion: string;
  longitud_serpiente: number;
  casillas_seguras: Direction[];
  casillas_peligrosas: Direction[];
}

export interface TypeSafeChoiceQuestion {
  type: "choice";
  instructions: string;
  criteria: Record<Direction, string>;
}

export interface TypeSafeSystemOneRequest {
  model: string;
  state: SemanticSnakeState;
  questions: {
    move: TypeSafeChoiceQuestion;
  };
}

export interface TypeSafeChoiceAnswer {
  type: "choice";
  choice: Direction;
  probabilities: Record<Direction, number>;
  confidence: number;
}

export interface TypeSafeSystemOneResponse {
  model: string;
  answers: {
    move: TypeSafeChoiceAnswer;
  };
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface MoveDecision {
  turn: number;
  timestamp: number;
  semanticState: SemanticSnakeState;
  jevChoice: Direction;
  finalChoice: Direction;
  correctedByCode: boolean;
  correctionReason?: string;
  probabilities: Record<Direction, number>;
  confidence: number;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  requestPayload: TypeSafeSystemOneRequest;
  rawResponse: TypeSafeSystemOneResponse;
  isSimulated?: boolean;
}

export interface GameStats {
  score: number;
  highScore: number;
  applesEaten: number;
  totalMoves: number;
  totalCorrections: number;
  currentLatencyMs: number;
  averageLatencyMs: number;
  latencyHistory: number[];
  totalInputTokens: number;
  totalCostUsd: number;
}

export type GameMode = "auto" | "manual";
export type GameStatus = "idle" | "playing" | "paused" | "game_over";
