'use client'

import { useState, type ReactNode } from 'react';

import Chat from '@/components/Chat'
import Form from '@/components/Form'

export default function Home() {
  const [state, setState] = useState({
    chat: false,
    pages: 3,
    website: process.env.NEXT_PUBLIC_DEFAULT_WEBSITE ?? 'https://hupe1980.github.io/golc/sitemap.xml',
    table: '',
    modelName: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxDocs: 3,
  })

  return (
    <main className="flex min-h-screen flex-col">
      {state.chat ? (
        <div className="flex h-full flex-grow flex-col justify-end items-center p-6 md:p-24">
          <Chat state={state} setState={setState} />
        </div>
      ) : (
        <div className="p-6 md:p-24">
          <div className="md:w-3/4">
            <h5 className="mb-2 text-4xl md:text-8xl font-bold tracking-tight text-gray-900">Next.js AI Chatbot - Chat with <span className="text-chatbot">any website</span></h5>
            <p className="block mb-5 text-xl font-normal text-gray-700">
              Use an AI chatbot with website context retrieved from a LanceDB vector store. LanceDB is lightweight and can be <b>embedded directly into <a href="https://nextjs.org" target="_blank" className="inline-flex items-center font-medium text-chatbot hover:underline">Next.js</a></b>, with data stored on-prem or e.g. <a href='https://aws.amazon.com/de/s3/' target="_blank" className="inline-flex items-center font-medium text-chatbot hover:underline">Amazon S3</a>.
            </p>
            <Form state={state} setState={setState} />
          </div>

          <div className="flex flex-col w-full items-center md:items-start md:flex-row space-y-3 md:space-y-0 md:space-x-3">
            <Card>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-gray-500 mb-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              <h5 className="mb-2 text-2xl font-semibold tracking-tight text-gray-900">Gets relevant information</h5>
              <p className="font-normal text-gray-500 ">By using a vector store, we can retrieve relevant up-to-date information for use in chat completion.</p>
            </Card>

            <Card>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-gray-500 mb-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
              </svg>
              <h5 className="mb-2 text-2xl font-semibold tracking-tight text-gray-900">Reduces hallucinations</h5>
              <p className="font-normal text-gray-500 ">By using a source of truth, we provide a structural basis for LLM answers. This is known as retrieval augmented generation.</p>
            </Card>

            <Card>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-gray-500 mb-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
              <h5 className="mb-2 text-2xl font-semibold tracking-tight text-gray-900">Immersive chat experience</h5>
              <p className="font-normal text-gray-500 ">Encounter instant responses fueled by real-time information and streaming, ensuring a dynamic chat experience.</p>
            </Card>
          </div>
        </div>
      )
      }
    </main>
  );
}


function Card({children}: {children: ReactNode }) {
  return (
    <div className="md:max-w-sm p-6 h-full bg-white border border-gray-200 rounded-lg">
      {children}
    </div>
  )
}