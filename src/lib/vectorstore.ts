import { connect as lanceConnect } from 'vectordb';

export async function connect() {
    const uri = process.env.LANCE_DB_URI ?? '/tmp/website-lancedb'
    return lanceConnect(uri);
}