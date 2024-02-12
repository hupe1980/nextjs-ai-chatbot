import { connect, OpenAIEmbeddingFunction } from 'vectordb'

export async function retrieveContext(query: string, table: string): Promise<EntryWithContext[]> {
  const db = await connect('/tmp/website-lancedb')
  
  const apiKey = process.env.OPENAI_API_KEY ?? ''
  
  const embedFunction = new OpenAIEmbeddingFunction('context', apiKey)
  
  const tbl = await db.openTable(table, embedFunction)
  
  console.log('Query: ', query)
  
  return await tbl
    .search(query)
    .select(['link', 'text', 'context'])
    .limit(3)
    .execute() as EntryWithContext[]
}