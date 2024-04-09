import Mustache from "mustache";
import { CorePersona } from "@/lib/types";
import { CardData } from "@shared/types";
import { ProviderMessages } from "@/lib/provider/provider";
import { Message as DBMessage } from "@shared/db_types";
import { getTokenizer } from "@/lib/tokenizer/provider";
import { deepFreeze } from "@shared/utils";

export type PromptVariant = "xml" | "markdown";

export interface ContextParams {
  chatID: number;
  latestUserMessage: string;
  cardData: CardData;
  persona: CorePersona;
  jailbreak: string;
  variant: PromptVariant;
  model: string;
  tokenLimit: number;
}

interface SystemPromptParams extends Pick<ContextParams, "cardData" | "persona" | "jailbreak" | "variant"> {
  characterMemory: string;
}

interface Context {
  system: string;
  messages: ProviderMessages;
}

/**
 * Generates a context object containing the system prompt and an array of messages for a given set of parameters.
 * A context includes:
 * - The system prompt
 * - The array of messages in the context window
 */
async function getContext(params: ContextParams): Promise<Context> {
  const systemPromptParams = {
    cardData: params.cardData,
    persona: params.persona,
    characterMemory: "",
    jailbreak: params.jailbreak,
    variant: params.variant
  };
  const systemPrompt = renderSystemPrompt(systemPromptParams);

  const tokenizer = getTokenizer(params.model);
  const userMessageTokens = tokenizer.countTokens(params.latestUserMessage);
  const systemPromptTokens = tokenizer.countTokens(systemPrompt);
  const remainingTokens = params.tokenLimit - (userMessageTokens + systemPromptTokens);

  if (remainingTokens < 500) {
    throw new Error(
      "System prompt and latest user message is taking up too many tokens.  There remains less than 500 tokens for the context window.  Please reduce the size of the system prompt or latest user message."
    );
  }

  // Fetch messages to fill up the context window.
  let fromID: number | undefined;
  let contextWindowTokens = 0;
  let contextWindow: Message[] = [];
  while (contextWindowTokens < remainingTokens) {
    const messages = await getMessagesStartingFrom(params.chatID, 100, fromID);
    // No more messages to fetch.
    if (messages.length === 0) {
      break;
    }
    for (const message of messages) {
      const messageTokens = message.text !== undefined ? tokenizer.countTokens(message.text) : 0;
      // If adding the message would exceed the token limit, break.
      if (contextWindowTokens + messageTokens > remainingTokens) {
        break;
      }
      contextWindow.push(message);
      contextWindowTokens += messageTokens;
      fromID = message.id;
    }
  }

  const providerMessages = contextWindow.map((m) => {
    return {
      role: m.sender_type === "user" ? "user" : "assistant",
      content: m.text === undefined ? "" : m.text
    };
  });

  // Reverse the messages so that the most recent message is at the end.
  providerMessages.reverse();

  // Make sure the first message in the context window is a user message by padding
  if (providerMessages.length > 0 && providerMessages[0].role === "assistant") {
    providerMessages.unshift({
      role: "user",
      content: "Now begin the conversation based on the given instructions above."
    });
  }
  providerMessages.push({
    role: "user",
    content: params.latestUserMessage
  });

  return {
    system: systemPrompt,
    messages: providerMessages
  };
}

type Message = Pick<DBMessage, "id" | "sender_type" | "text">;
/**
 * Fetches a limited number of messages from the database starting from a given message ID for the specified chat.
 *
 * @param chatID - The ID of the chat to fetch messages for.
 * @param limit - The maximum number of messages to fetch.
 * @param messageID - The ID of the message to start fetching from. If not provided, the most recent messages will be fetched.
 * @returns An array of `Message` objects containing the fetched messages.
 */
async function getMessagesStartingFrom(chatID: number, limit: number, messageID?: number): Promise<Message[]> {
  let query: string;
  if (messageID === undefined) {
    query = `
    SELECT * FROM messages
    WHERE chat_id = ${chatID}
    ORDER BY id desc
    LIMIT ${limit}
    `.trim();
  } else {
    query = `
    SELECT * FROM messages
    WHERE chat_id = ${chatID} AND id < ${messageID}
    ORDER BY id desc
    LIMIT ${limit}
    `.trim();
  }

  return (await window.api.sqlite.all(query)) as Message[];
}

/**
 * Renders the system prompt template using the provided prompt parameters.
 *
 * @param params - The prompt parameters, including the card data, persona, character memory, and jailbreak settings.
 * @returns The rendered system prompt string.
 */
function renderSystemPrompt(params: SystemPromptParams): string {
  const template = getTemplate(params.variant);
  const ctx = {
    card: params.cardData,
    persona: params.persona,
    characterMemory: params.characterMemory,
    jailbreak: params.jailbreak
  };

  const systemPrompt = Mustache.render(template, ctx);
  return systemPrompt;
}

/**
 * Returns the template string for the given prompt variant.
 *
 * @param variant - The prompt variant to get the template for.
 * @returns The template string.
 */
function getTemplate(variant: PromptVariant) {
  switch (variant) {
    case "xml":
      throw new Error("Not implemented");
    case "markdown":
      return `
### Instruction
You are now roleplaying as {{{card.character.name}}}. 
You are in a chat with {{{persona.name}}}. \

{{#card.character.description}}

### Character Info
{{{card.character.description}}}
{{/card.character.description}} \

{{#card.world.description}}

### World Info
{{{card.world.description}}}
{{/card.world.description}} \

{{#persona.description}}

### User Info
User's description: {{{persona.description}}}
{{/persona.description}} \

{{#characterMemory}}

### Character Memory
{{{characterMemory}}}
{{/characterMemory}} \

{{#card.character.msg_examples}}

### Messages Examples
{{{card.character.msg_examples}}}
{{/card.character.msg_examples}} \

{{{jailbreak}}}
      `.trim();
    default:
      throw new Error("Invalid prompt variant");
  }
}

export const context = {
  getContext,
  renderSystemPrompt
};
deepFreeze(context);