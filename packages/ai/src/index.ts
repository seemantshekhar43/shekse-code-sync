import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { Analysis } from "@scs/types";
import { generateObject, type LanguageModel } from "ai";

export interface AnalyzeInput {
  title: string;
  statement: string;
  language: string;
  code: string;
}

/**
 * Vendor-neutral analysis surface. The concrete model is chosen from env
 * (AI_PROVIDER / AI_MODEL), so swapping providers is a config change, not a
 * code change.
 */
export interface AiProvider {
  analyze(input: AnalyzeInput): Promise<Analysis>;
}

function selectModel(): LanguageModel {
  const provider = process.env.AI_PROVIDER ?? "anthropic";
  const modelId = process.env.AI_MODEL ?? "claude-opus-4-8";

  switch (provider) {
    case "anthropic": {
      const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      return anthropic(modelId);
    }
    case "openai": {
      const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
      return openai(modelId);
    }
    case "ollama": {
      // Ollama exposes an OpenAI-compatible endpoint (default .../v1).
      const openai = createOpenAI({
        baseURL: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1",
        apiKey: "ollama",
      });
      return openai(modelId);
    }
    default:
      throw new Error(`Unknown AI_PROVIDER: ${provider}`);
  }
}

const PROMPT = (input: AnalyzeInput) =>
  [
    `You are reviewing a solved coding problem. Return a concise analysis.`,
    `Title: ${input.title}`,
    `Language: ${input.language}`,
    `Problem:\n${input.statement}`,
    `Solution:\n${input.code}`,
  ].join("\n\n");

export const aiProvider: AiProvider = {
  async analyze(input) {
    const { object } = await generateObject({
      model: selectModel(),
      schema: Analysis,
      prompt: PROMPT(input),
    });
    return object;
  },
};
