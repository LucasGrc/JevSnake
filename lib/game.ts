import {
  CellState,
  Coordinates,
  Direction,
  SemanticNeighbors,
  SemanticSnakeState,
  TypeSafeChoiceQuestion,
  TypeSafeSystemOneRequest,
} from "./types";

export const GRID_SIZE = 16;
export const COST_PER_MILLION_INPUT_TOKENS = 0.043; // $0.043 USD por 1M tokens de entrada

export function isOppositeDirection(a: Direction, b: Direction): boolean {
  return (
    (a === "up" && b === "down") ||
    (a === "down" && b === "up") ||
    (a === "left" && b === "right") ||
    (a === "right" && b === "left")
  );
}

export function calculateRelativeFoodDirection(
  head: Coordinates,
  food: Coordinates
): string {
  const dx = food.x - head.x;
  const dy = food.y - head.y;

  if (dx === 0 && dy === 0) return "justo en la posición de la cabeza";
  if (dx === 0 && dy < 0) return "directamente arriba";
  if (dx === 0 && dy > 0) return "directamente abajo";
  if (dx < 0 && dy === 0) return "directamente a la izquierda";
  if (dx > 0 && dy === 0) return "directamente a la derecha";

  const vertical = dy < 0 ? "arriba" : "abajo";
  const horizontal = dx < 0 ? "a la izquierda" : "a la derecha";
  return `${vertical} y ${horizontal}`;
}

export function getDirectionSpanish(dir: Direction): string {
  switch (dir) {
    case "up":
      return "arriba";
    case "down":
      return "abajo";
    case "left":
      return "izquierda";
    case "right":
      return "derecha";
  }
}

export function getCellState(
  target: Coordinates,
  snake: Coordinates[],
  gridSize: number = GRID_SIZE
): CellState {
  // Verificar paredes
  if (
    target.x < 0 ||
    target.x >= gridSize ||
    target.y < 0 ||
    target.y >= gridSize
  ) {
    return "pared";
  }

  // Verificar cuerpo de la serpiente (excluyendo la cabeza misma)
  const hitsBody = snake.slice(1).some(
    (segment) => segment.x === target.x && segment.y === target.y
  );

  if (hitsBody) {
    return "cuerpo";
  }

  return "libre";
}

export function getNeighborsState(
  head: Coordinates,
  snake: Coordinates[],
  gridSize: number = GRID_SIZE
): SemanticNeighbors {
  return {
    arriba: getCellState({ x: head.x, y: head.y - 1 }, snake, gridSize),
    abajo: getCellState({ x: head.x, y: head.y + 1 }, snake, gridSize),
    izquierda: getCellState({ x: head.x - 1, y: head.y }, snake, gridSize),
    derecha: getCellState({ x: head.x + 1, y: head.y }, snake, gridSize),
  };
}

export function buildSemanticState(
  head: Coordinates,
  snake: Coordinates[],
  food: Coordinates,
  currentDirection: Direction,
  gridSize: number = GRID_SIZE
): SemanticSnakeState {
  const neighbors = getNeighborsState(head, snake, gridSize);
  const foodRelative = calculateRelativeFoodDirection(head, food);
  const dirSpanish = getDirectionSpanish(currentDirection);

  const safeDirections: Direction[] = [];
  const dangerDirections: Direction[] = [];

  const checkDir = (dir: Direction, state: CellState) => {
    // Además de que no sea pared ni cuerpo, una serpiente no puede girar 180° hacia su propio cuello
    const isOpposite = isOppositeDirection(dir, currentDirection);
    if (state === "libre" && !isOpposite) {
      safeDirections.push(dir);
    } else {
      dangerDirections.push(dir);
    }
  };

  checkDir("up", neighbors.arriba);
  checkDir("down", neighbors.abajo);
  checkDir("left", neighbors.izquierda);
  checkDir("right", neighbors.derecha);

  const resumen = `Serpiente dirigiéndose hacia ${dirSpanish}. La comida está ${foodRelative}. Casillas seguras: [${
    safeDirections.map(getDirectionSpanish).join(", ") || "ninguna"
  }]. Casillas bloqueadas o mortales: [${
    dangerDirections
      .map(
        (d) =>
          `${getDirectionSpanish(d)} (${
            isOppositeDirection(d, currentDirection)
              ? "giro 180° prohibido"
              : neighbors[d === "up" ? "arriba" : d === "down" ? "abajo" : d === "left" ? "izquierda" : "derecha"]
          })`
      )
      .join(", ") || "ninguna"
  }].`;

  return {
    direccion_actual: dirSpanish,
    posicion_comida: foodRelative,
    vecinos: neighbors,
    resumen_situacion: resumen,
    longitud_serpiente: snake.length,
    casillas_seguras: safeDirections,
    casillas_peligrosas: dangerDirections,
  };
}

export function buildChoiceQuestion(
  state: SemanticSnakeState,
  head: Coordinates,
  food: Coordinates,
  currentDirection: Direction
): TypeSafeChoiceQuestion {
  const dx = food.x - head.x;
  const dy = food.y - head.y;

  const criteriaFor = (
    dir: Direction,
    neighborStatus: CellState,
    approachesFood: boolean
  ): string => {
    if (isOppositeDirection(dir, currentDirection)) {
      return `Moverse hacia ${getDirectionSpanish(
        dir
      )}: PELIGRO FATAL: Giro de 180° directo contra el cuello de la serpiente.`;
    }

    const statusText =
      neighborStatus === "libre"
        ? "Espacio completamente despejado y seguro"
        : neighborStatus === "pared"
        ? "PELIGRO FATAL: Choca directamente con el muro exterior"
        : "PELIGRO FATAL: Choca directamente contra el cuerpo de la serpiente";

    const foodText = approachesFood
      ? "acerca a la comida"
      : "no acerca inmediatamente a la comida";

    return `Moverse hacia ${getDirectionSpanish(dir)}: ${statusText}. Esta opción ${foodText}.`;
  };

  return {
    type: "choice",
    instructions:
      "Evalúa el estado semántico de la serpiente y selecciona la dirección ('up', 'down', 'left', 'right') más inteligente. Regla primordial: SOBREVIVIR evitando toda pared, colisión con el propio cuerpo o giro inverso de 180°. Regla secundaria: avanzar hacia la posición relativa de la comida.",
    criteria: {
      up: criteriaFor("up", state.vecinos.arriba, dy < 0),
      down: criteriaFor("down", state.vecinos.abajo, dy > 0),
      left: criteriaFor("left", state.vecinos.izquierda, dx < 0),
      right: criteriaFor("right", state.vecinos.derecha, dx > 0),
    },
  };
}

export function buildSystemOnePayload(
  state: SemanticSnakeState,
  head: Coordinates,
  food: Coordinates,
  currentDirection: Direction
): TypeSafeSystemOneRequest {
  return {
    model: "jev-latest",
    state,
    questions: {
      move: buildChoiceQuestion(state, head, food, currentDirection),
    },
  };
}

export interface MoveSafetyResult {
  finalChoice: Direction;
  correctedByCode: boolean;
  correctionReason?: string;
}

export function evaluateSafetyAndCorrect(
  jevChoice: Direction,
  probabilities: Record<Direction, number>,
  neighbors: SemanticNeighbors,
  currentDirection: Direction
): MoveSafetyResult {
  const neighborFor = (dir: Direction): CellState => {
    switch (dir) {
      case "up":
        return neighbors.arriba;
      case "down":
        return neighbors.abajo;
      case "left":
        return neighbors.izquierda;
      case "right":
        return neighbors.derecha;
    }
  };

  const isOpposite = isOppositeDirection(jevChoice, currentDirection);
  const chosenCell = neighborFor(jevChoice);
  const isMortal = chosenCell === "pared" || chosenCell === "cuerpo" || isOpposite;

  if (!isMortal) {
    return {
      finalChoice: jevChoice,
      correctedByCode: false,
    };
  }

  const dangerReason = isOpposite
    ? "giro 180° suicida contra el cuello"
    : chosenCell;

  // Si la opción elegida por Jev es mortal, ordenar las direcciones por probabilidad descendente
  const allDirections: Direction[] = ["up", "down", "left", "right"];
  const sortedCandidates = allDirections
    .filter((d) => d !== jevChoice && !isOppositeDirection(d, currentDirection))
    .sort((a, b) => (probabilities[b] ?? 0) - (probabilities[a] ?? 0));

  // Buscar la primera que esté libre
  const safeCandidate = sortedCandidates.find((d) => neighborFor(d) === "libre");

  if (safeCandidate) {
    const jevProb = Math.round((probabilities[jevChoice] ?? 0) * 100);
    const candidateProb = Math.round((probabilities[safeCandidate] ?? 0) * 100);
    return {
      finalChoice: safeCandidate,
      correctedByCode: true,
      correctionReason: `Jev eligió '${getDirectionSpanish(
        jevChoice
      )}' (${jevProb}%) pero es mortal (${dangerReason}). El código corrigió a la opción segura '${getDirectionSpanish(
        safeCandidate
      )}' (${candidateProb}%).`,
    };
  }

  // Si ninguna está libre (encerrada), se mantiene la decisión original
  return {
    finalChoice: jevChoice,
    correctedByCode: false,
    correctionReason: "No existen casillas seguras disponibles; colisión inevitable.",
  };
}

export function calculateMoveCost(inputTokens: number): number {
  return (inputTokens / 1_000_000) * COST_PER_MILLION_INPUT_TOKENS;
}
