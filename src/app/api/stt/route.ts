import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const audio = formData.get('audio');
  if (!audio || typeof audio === 'string') {
    return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
  }

  if (audio.size > 25_000_000) {
    return NextResponse.json({ error: 'Audio file too large' }, { status: 413 });
  }

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: audio as File,
      model: 'whisper-1',
      language: 'en',
    });

    return NextResponse.json({ transcript: transcription.text });
  } catch {
    console.error('[api/stt] upstream error');
    return NextResponse.json({ error: 'Transcription unavailable' }, { status: 503 });
  }
}
