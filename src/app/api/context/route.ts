import { NextResponse } from 'next/server';

import { createEmbeddingsTable } from './insert';


export async function POST(req: Request) {
    const { url, pages } = await req.json()

    try {
        const name = await createEmbeddingsTable(url, pages)
        return NextResponse.json({ table: name })
    } catch (e) {
        console.log(e)
        return NextResponse.json(e, {
            status: 400
        })
    }
}
