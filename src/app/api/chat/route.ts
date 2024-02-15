import { Message as VercelChatMessage, StreamingTextResponse } from 'ai'
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { BytesOutputParser, StringOutputParser } from '@langchain/core/output_parsers';
import { OpenAIEmbeddingFunction } from 'vectordb'

import { connect } from '@/lib/vectorstore'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? ''

const REPHRASE_TEMPLATE = `Rephrase the follow-up question to make it a standalone inquiry, maintaining its original language. You'll be provided with a conversation history and a follow-up question.

Instructions:
1. Review the conversation provided below, including both user and AI messages.
2. Examine the follow-up question included in the conversation.
3. Reconstruct the follow-up question to be self-contained, without requiring context from the previous conversation. Ensure it remains in the same language as the original.

Conversation:
###
{chatHistory}
###

User's Follow-Up Question:
### 
{input}
###

Your Response:`

const QA_TEMPLATE = `Based on the information provided below from a website, act as a guide to assist someone navigating through the website.

Instructions:
1. Review the conversation history and the contextual information extracted from the website.
2. Assume the role of a helpful agent and respond to the user's input accordingly.
3. Provide guidance, explanations, or assistance as needed, leveraging the website context to enhance your responses.

Conversation History:
###
{chatHistory}
###

Context from Website:
###
{context}
###

User's Input: 
###
{input}
###

Your Response:`


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
    const db = await connect()
    
    const embedFunction = new OpenAIEmbeddingFunction('context', OPENAI_API_KEY)
    
    const tbl = await db.openTable(table, embedFunction)
    
    console.log('Query: ', query)
    
    return await tbl
      .search(query)
      .select(['link', 'title', 'text', 'context'])
      .limit(k)
      .execute() as EntryWithContext[]
  }

export async function POST(req: Request) {
    const { messages, table, modelName, temperature, maxDocs } = await req.json()

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

    const context = await (async () => {
        const result = await retrieveContext(rephrasedInput, table, maxDocs)
        return result.map(c => {
            if (c.title) return `${c.title}\n${c.context}`
            return c.context
        }).join('\n\n---\n\n').substring(0, 3750) // need to make sure our prompt is not larger than max size
    })()

    console.log("Context:")
    console.log(context); 

    const qaPrompt = PromptTemplate.fromTemplate(QA_TEMPLATE);

    // Chat models stream message chunks rather than bytes, so this
    // output parser handles serialization and encoding.
    const outputParser = new BytesOutputParser();

    const qaChain = qaPrompt.pipe(model).pipe(outputParser);

    const stream = await qaChain.stream({
        chatHistory: formattedPreviousMessages.join('\n'),
        context, 
        input: rephrasedInput,
    });

    return new StreamingTextResponse(stream)
}