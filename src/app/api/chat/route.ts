import { Message as VercelChatMessage, StreamingTextResponse } from 'ai'
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { BytesOutputParser, StringOutputParser } from '@langchain/core/output_parsers';
import { connect, OpenAIEmbeddingFunction } from 'vectordb'
import { getEnv } from 'get-env-or-die';

const OPENAI_API_KEY = getEnv('OPENAI_API_KEY')

const REPHRASE_TEMPLATE = `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question, in its original language.

Current conversation:
{chatHistory}

User: {{input}}
AI:`

const QA_TEMPLATE = `The context that follows is pulled from a website. Respond based on the website information below, acting as an agent guiding someone through the website.

Current conversation:
{chatHistory}

Context:
{context}

User: {input}
AI:`


/**
 * Basic memory formatter that stringifies and passes
 * message history directly into the model.
 */
function formatMessage(message: VercelChatMessage) {
    return `${message.role}: ${message.content}`;
};

async function rephraseInput(model: ChatOpenAI, chatHistory: string[], input: string) {
    if (chatHistory.length === 0) return input;

    const rephrasePrompt = PromptTemplate.fromTemplate(REPHRASE_TEMPLATE);

    const stringOutputParser = new StringOutputParser();

    const rephraseChain = rephrasePrompt.pipe(model).pipe(stringOutputParser)

    return rephraseChain.invoke({
        chatHistory: chatHistory.join('\n'),
        input,
    });
}

async function retrieveContext(query: string, table: string, k = 3): Promise<EntryWithContext[]> {
    const db = await connect('/tmp/website-lancedb')
    
    const embedFunction = new OpenAIEmbeddingFunction('context', OPENAI_API_KEY)
    
    const tbl = await db.openTable(table, embedFunction)
    
    console.log('Query: ', query)
    
    return await tbl
      .search(query)
      .select(['link', 'text', 'context'])
      .limit(k)
      .execute() as EntryWithContext[]
  }

export async function POST(req: Request) {
    const { messages, table, modelName, temperature } = await req.json()

    const model = new ChatOpenAI({
        modelName,
        temperature,
        openAIApiKey: OPENAI_API_KEY,
        streaming: true,
    });

    const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage);
    
    const currentMessageContent = messages[messages.length - 1].content;

    console.log("Current message:", currentMessageContent)

    const rephrasedInput = await rephraseInput(model, formattedPreviousMessages, currentMessageContent);

    const context = await retrieveContext(rephrasedInput, table)

    const qaPrompt = PromptTemplate.fromTemplate(QA_TEMPLATE);

    // Chat models stream message chunks rather than bytes, so this
    // output parser handles serialization and encoding.
    const outputParser = new BytesOutputParser();

    const qaChain = qaPrompt.pipe(model).pipe(outputParser);

    const stream = await qaChain.stream({
        chatHistory: formattedPreviousMessages.join('\n'),
        context: context.map(c => c.context).join('\n\n---\n\n').substring(0, 3750), // need to make sure our prompt is not larger than max size
        input: rephrasedInput,
    });

    return new StreamingTextResponse(stream)
}