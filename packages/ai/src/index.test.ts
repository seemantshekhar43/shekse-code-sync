import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createOpenAI = vi.fn(() => vi.fn(() => "model"));
const createAnthropic = vi.fn(() => vi.fn(() => "model"));

vi.mock("@ai-sdk/openai", () => ({ createOpenAI }));
vi.mock("@ai-sdk/anthropic", () => ({ createAnthropic }));

// Imported after the mocks are registered.
const { selectModel } = await import("./index.js");

describe("selectModel openai base URL", () => {
  const saved = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AI_PROVIDER = "openai";
    process.env.OPENAI_API_KEY = "key";
    delete process.env.OPENAI_BASE_URL;
  });

  afterEach(() => {
    process.env = { ...saved };
  });

  it("passes OPENAI_BASE_URL through to the OpenAI client when set", () => {
    process.env.OPENAI_BASE_URL = "https://gateway.example.com/v1";
    selectModel();
    expect(createOpenAI).toHaveBeenCalledWith(
      expect.objectContaining({ apiKey: "key", baseURL: "https://gateway.example.com/v1" }),
    );
  });

  it("leaves baseURL undefined (SDK default) when OPENAI_BASE_URL is unset", () => {
    selectModel();
    expect(createOpenAI).toHaveBeenCalledWith(
      expect.objectContaining({ apiKey: "key", baseURL: undefined }),
    );
  });
});
