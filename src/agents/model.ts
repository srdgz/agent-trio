import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import { mistral } from "@ai-sdk/mistral";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import {
  APICallError,
  NoObjectGeneratedError,
  NoOutputGeneratedError,
  Output,
  generateText,
  streamText,
  type LanguageModel,
} from "ai";
import type { z } from "zod";
import { LIMITS } from "@/domain/limits";
import type { AgentId } from "@/domain/types";

export class TransientModelError extends Error {
  constructor(
    message: string,
    readonly retryAfterMs: number,
  ) {
    super(message);
  }
}

function openRouterModel(modelId: string) {
  return createOpenAICompatible({
    name: "openrouter",
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    supportsStructuredOutputs: true,
  }).chatModel(modelId);
}

const PRIMARY_MODELS: Record<AgentId, () => LanguageModel> = {
  orchestrator: () => google(process.env.ORCHESTRATOR_MODEL || "gemini-3.6-flash"),
  develop: () => groq(process.env.DEVELOP_MODEL || "openai/gpt-oss-120b"),
  testing: () => openRouterModel(process.env.TESTING_MODEL || "nvidia/nemotron-3.5-super-vl:free"),
};

function fallbackModel() {
  return mistral(process.env.FALLBACK_MODEL || "codestral-latest");
}

function retryDelay(headers: Record<string, string> | undefined) {
  const seconds = Number(headers?.["retry-after"]);
  if (!Number.isFinite(seconds) || seconds <= 0) return LIMITS.defaultRetryMs;
  return Math.min(seconds * 1000, LIMITS.maxRetryMs);
}

function canFallBack(error: unknown) {
  return (
    APICallError.isInstance(error) ||
    NoObjectGeneratedError.isInstance(error) ||
    NoOutputGeneratedError.isInstance(error) ||
    (error instanceof DOMException && error.name === "TimeoutError")
  );
}

function toTransientError(error: unknown) {
  if (NoObjectGeneratedError.isInstance(error) || NoOutputGeneratedError.isInstance(error)) {
    return new TransientModelError("El modelo devolvió una respuesta no válida.", 2_000);
  }
  if (error instanceof DOMException && error.name === "TimeoutError") {
    return new TransientModelError("El modelo ha tardado demasiado.", LIMITS.defaultRetryMs);
  }
  if (APICallError.isInstance(error)) {
    if (error.statusCode === 429) {
      return new TransientModelError(
        "Se ha alcanzado el límite gratuito de los modelos.",
        retryDelay(error.responseHeaders),
      );
    }
    if (error.isRetryable) {
      return new TransientModelError("El proveedor de IA no está disponible.", LIMITS.defaultRetryMs);
    }
  }
  return null;
}

type StructuredOptions<T> = {
  agent: AgentId;
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
};

async function callModel<T>(model: LanguageModel, options: StructuredOptions<T>) {
  const result = await generateText({
    model,
    system: options.system,
    prompt: options.prompt,
    output: Output.object({ schema: options.schema }),
    maxRetries: 0,
    abortSignal: AbortSignal.timeout(LIMITS.modelTimeoutMs),
  });
  return { data: result.output, tokens: result.totalUsage.totalTokens ?? 0 };
}

async function streamModel<T>(
  model: LanguageModel,
  options: StructuredOptions<T>,
  onPartial: (partial: unknown) => void,
) {
  let streamError: unknown;
  const result = streamText({
    model,
    system: options.system,
    prompt: options.prompt,
    output: Output.object({ schema: options.schema }),
    maxRetries: 0,
    abortSignal: AbortSignal.timeout(LIMITS.modelTimeoutMs),
    onError({ error }) {
      streamError = error;
    },
  });

  for await (const partial of result.partialOutputStream) onPartial(partial);
  if (streamError) throw streamError;
  const [data, usage] = await Promise.all([result.output, result.totalUsage]);
  return { data, tokens: usage.totalTokens ?? 0 };
}

export async function streamStructured<T>(
  options: StructuredOptions<T>,
  onPartial: (partial: unknown) => void,
) {
  try {
    const result = await streamModel(PRIMARY_MODELS[options.agent](), options, onPartial);
    return { ...result, usedFallback: false };
  } catch (primaryError) {
    if (!canFallBack(primaryError) || !process.env.MISTRAL_API_KEY) {
      throw toTransientError(primaryError) ?? primaryError;
    }
    console.warn("Primary model failed, using fallback", {
      agent: options.agent,
      status: APICallError.isInstance(primaryError) ? primaryError.statusCode : undefined,
    });
    try {
      const result = await streamModel(fallbackModel(), options, onPartial);
      return { ...result, usedFallback: true };
    } catch (fallbackError) {
      throw toTransientError(fallbackError) ?? fallbackError;
    }
  }
}

export async function generateStructured<T>(options: StructuredOptions<T>) {
  try {
    const result = await callModel(PRIMARY_MODELS[options.agent](), options);
    return { ...result, usedFallback: false };
  } catch (primaryError) {
    if (!canFallBack(primaryError) || !process.env.MISTRAL_API_KEY) {
      throw toTransientError(primaryError) ?? primaryError;
    }
    console.warn("Primary model failed, using fallback", {
      agent: options.agent,
      status: APICallError.isInstance(primaryError) ? primaryError.statusCode : undefined,
    });
    try {
      const result = await callModel(fallbackModel(), options);
      return { ...result, usedFallback: true };
    } catch (fallbackError) {
      throw toTransientError(fallbackError) ?? fallbackError;
    }
  }
}
