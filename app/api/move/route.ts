import { NextRequest, NextResponse } from "next/server";
import {
  Direction,
  SemanticSnakeState,
  TypeSafeChoiceQuestion,
  TypeSafeSystemOneRequest,
  TypeSafeSystemOneResponse,
} from "@/lib/types";
import { COST_PER_MILLION_INPUT_TOKENS } from "@/lib/game";

export const dynamic = "force-dynamic";

interface RequestBody {
  state: SemanticSnakeState;
  questions: {
    move: TypeSafeChoiceQuestion;
  };
}

export async function POST(req: NextRequest) {
  const startTime = performance.now();

  try {
    const body = (await req.json()) as RequestBody;

    if (!body || !body.state || !body.questions?.move) {
      return NextResponse.json(
        { error: "Payload inválido. Se requiere 'state' y 'questions.move'." },
        { status: 400 }
      );
    }

    const payload: TypeSafeSystemOneRequest = {
      model: "jev-latest",
      state: body.state,
      questions: body.questions,
    };

    const apiKey =
      process.env.TYPESAFE_APIKEY ||
      process.env.TYPESAFE_API_KEY ||
      process.env.NEXT_PUBLIC_TYPESAFE_APIKEY;

    // Si hay API key configurada en el servidor, consultamos la API oficial de TypeSafe System One
    if (apiKey && apiKey.trim() !== "" && apiKey !== "tu_api_key_aqui") {
      try {
        const apiResponse = await fetch("https://api.typesafe.ai/v1/systemone", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey.trim()}`,
          },
          body: JSON.stringify(payload),
        });

        const latencyMs = Math.max(1, Math.round(performance.now() - startTime));

        if (apiResponse.ok) {
          const data = (await apiResponse.json()) as TypeSafeSystemOneResponse;
          const answer = data.answers?.move;

          if (answer) {
            const inputTokens = data.usage?.input_tokens ?? 145;
            const outputTokens = data.usage?.output_tokens ?? 25;
            const costUsd =
              (inputTokens / 1_000_000) * COST_PER_MILLION_INPUT_TOKENS;

            return NextResponse.json({
              chosenDirection: answer.choice,
              probabilities: answer.probabilities,
              confidence: answer.confidence,
              model: data.model || "jev-latest",
              usage: {
                input_tokens: inputTokens,
                output_tokens: outputTokens,
              },
              costUsd,
              latencyMs,
              requestPayload: payload,
              rawResponse: data,
              isSimulated: false,
            });
          }
        }

        // Si la API respondió con error (por ejemplo 402 billing_error, 401, 429)
        const errorText = await apiResponse.text();
        let errorMessage = `Error TypeSafe (${apiResponse.status})`;
        try {
          const parsed = JSON.parse(errorText);
          errorMessage =
            parsed?.detail?.message ||
            parsed?.message ||
            parsed?.error ||
            errorText;
        } catch {
          errorMessage = errorText;
        }

        // Para evitar que la serpiente se congele y la interfaz quede rota,
        // generamos la decisión con el motor semántico de fallback y notificamos el error al cliente
        const simulatedResult = generateSimulatedDecision(body.state);
        const fallbackResponse: TypeSafeSystemOneResponse = {
          model: `jev-latest (API HTTP ${apiResponse.status} - fallback activo)`,
          answers: {
            move: {
              type: "choice",
              choice: simulatedResult.choice,
              probabilities: simulatedResult.probabilities,
              confidence: simulatedResult.confidence,
            },
          },
          usage: {
            input_tokens: 154,
            output_tokens: 24,
          },
        };

        const costUsd =
          (fallbackResponse.usage.input_tokens / 1_000_000) *
          COST_PER_MILLION_INPUT_TOKENS;

        return NextResponse.json({
          chosenDirection: simulatedResult.choice,
          probabilities: simulatedResult.probabilities,
          confidence: simulatedResult.confidence,
          model: `jev-latest (${apiResponse.status}: ${errorMessage})`,
          usage: fallbackResponse.usage,
          costUsd,
          latencyMs,
          requestPayload: payload,
          rawResponse: {
            typeSafeError: {
              status: apiResponse.status,
              message: errorMessage,
            },
            simulatedResponse: fallbackResponse,
          },
          isSimulated: true,
          apiError: {
            status: apiResponse.status,
            message: errorMessage,
          },
        });
      } catch (networkError) {
        // En caso de fallo de red
        const latencyMs = Math.max(1, Math.round(performance.now() - startTime));
        const simulatedResult = generateSimulatedDecision(body.state);
        return NextResponse.json({
          chosenDirection: simulatedResult.choice,
          probabilities: simulatedResult.probabilities,
          confidence: simulatedResult.confidence,
          model: "jev-latest (offline fallback)",
          usage: { input_tokens: 150, output_tokens: 20 },
          costUsd: (150 / 1_000_000) * COST_PER_MILLION_INPUT_TOKENS,
          latencyMs,
          requestPayload: payload,
          rawResponse: { networkError: String(networkError) },
          isSimulated: true,
          apiError: {
            status: 503,
            message: "No se pudo conectar con api.typesafe.ai (fallback activo).",
          },
        });
      }
    }

    // Modo de desarrollo sin API key configurada
    const simulatedResult = generateSimulatedDecision(body.state);
    const latencyMs = Math.max(120, Math.round(performance.now() - startTime + 90));

    const simulatedResponse: TypeSafeSystemOneResponse = {
      model: "jev-latest (simulado sin API Key)",
      answers: {
        move: {
          type: "choice",
          choice: simulatedResult.choice,
          probabilities: simulatedResult.probabilities,
          confidence: simulatedResult.confidence,
        },
      },
      usage: {
        input_tokens: 168,
        output_tokens: 28,
      },
    };

    const costUsd =
      (simulatedResponse.usage.input_tokens / 1_000_000) *
      COST_PER_MILLION_INPUT_TOKENS;

    return NextResponse.json({
      chosenDirection: simulatedResult.choice,
      probabilities: simulatedResult.probabilities,
      confidence: simulatedResult.confidence,
      model: "jev-latest (demo local)",
      usage: simulatedResponse.usage,
      costUsd,
      latencyMs,
      requestPayload: payload,
      rawResponse: simulatedResponse,
      isSimulated: true,
      simulationNotice:
        "Define TYPESAFE_APIKEY en .env.local para usar el modelo Jev real de TypeSafe.",
    });
  } catch (error) {
    const latencyMs = Math.round(performance.now() - startTime);
    const message =
      error instanceof Error ? error.message : "Error interno desconocido";
    return NextResponse.json(
      { error: message, latencyMs },
      { status: 500 }
    );
  }
}

/**
 * Heurística de simulación semántica fiel al razonamiento de Jev cuando
 * la API no tiene créditos o no hay API Key configurada.
 */
function generateSimulatedDecision(state: SemanticSnakeState): {
  choice: Direction;
  probabilities: Record<Direction, number>;
  confidence: number;
} {
  const directions: Direction[] = ["up", "down", "left", "right"];
  const weights: Record<Direction, number> = {
    up: 0.05,
    down: 0.05,
    left: 0.05,
    right: 0.05,
  };

  const foodText = state.posicion_comida.toLowerCase();

  for (const dir of directions) {
    const neighborState =
      dir === "up"
        ? state.vecinos.arriba
        : dir === "down"
        ? state.vecinos.abajo
        : dir === "left"
        ? state.vecinos.izquierda
        : state.vecinos.derecha;

    if (neighborState === "pared" || neighborState === "cuerpo") {
      weights[dir] = 0.01;
      continue;
    }

    let score = 0.35;
    if (dir === "up" && foodText.includes("arriba")) score += 0.55;
    if (dir === "down" && foodText.includes("abajo")) score += 0.55;
    if (dir === "left" && foodText.includes("izquierda")) score += 0.55;
    if (dir === "right" && foodText.includes("derecha")) score += 0.55;

    weights[dir] = score;
  }

  const totalWeight =
    weights.up + weights.down + weights.left + weights.right;

  const probs: Record<Direction, number> = {
    up: Number((weights.up / totalWeight).toFixed(3)),
    down: Number((weights.down / totalWeight).toFixed(3)),
    left: Number((weights.left / totalWeight).toFixed(3)),
    right: Number((weights.right / totalWeight).toFixed(3)),
  };

  let maxDir: Direction = "up";
  let maxP = -1;
  for (const d of directions) {
    if (probs[d] > maxP) {
      maxP = probs[d];
      maxDir = d;
    }
  }

  const confidence = Number(Math.min(0.98, Math.max(0.45, maxP * 1.15)).toFixed(2));

  return {
    choice: maxDir,
    probabilities: probs,
    confidence,
  };
}
