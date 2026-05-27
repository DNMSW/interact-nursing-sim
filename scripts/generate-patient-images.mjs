// Run with: node scripts/generate-patient-images.mjs
// Generates patient portrait images via DALL-E 3 and saves to public/patients/

import OpenAI from 'openai';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'patients');

mkdirSync(OUT_DIR, { recursive: true });

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const PATIENTS = [
  {
    id: '01-chest-pain-ed',
    prompt:
      'Photorealistic portrait photograph. A British white man aged approximately 58 with greying hair, wearing a casual open-collar shirt. He has a slightly worried but composed expression. Neutral light background. Upper body portrait. Warm natural lighting. No text.',
  },
  {
    id: '02-post-op-confusion-ward',
    prompt:
      'Photorealistic portrait photograph. An elderly British white woman aged approximately 82 with white hair and kind eyes, wearing a pale cardigan. Her expression is gentle and slightly bewildered. Neutral light background. Upper body portrait. Warm natural lighting. No text.',
  },
  {
    id: '03-insulin-refusal-ward',
    prompt:
      'Photorealistic portrait photograph. A British-Nigerian man aged approximately 45 in a smart casual shirt. He has a confident, slightly tense expression. Neutral light background. Upper body portrait. Warm natural lighting. No text.',
  },
  {
    id: '04-breaking-bad-news-relative',
    prompt:
      'Photorealistic portrait photograph. A British white woman aged approximately 52 with shoulder-length brown hair, wearing a smart blouse. She has a worried, concerned expression. Neutral light background. Upper body portrait. Warm natural lighting. No text.',
  },
  {
    id: '05-angry-relative-ed',
    prompt:
      'Photorealistic portrait photograph. A British white man aged approximately 35 with short hair, wearing a casual work jacket. He has a stressed, tense expression. Neutral light background. Upper body portrait. Warm natural lighting. No text.',
  },
  {
    id: '06-mental-health-community',
    prompt:
      'Photorealistic portrait photograph. A British South Asian woman aged approximately 31 with long dark hair, wearing comfortable everyday clothes. She has a quiet, subdued expression. Neutral light background. Upper body portrait. Warm natural lighting. No text.',
  },
  {
    id: '07-george-ashworth-glaucoma',
    prompt:
      'Photorealistic portrait photograph. A friendly British white man aged 52 with Down syndrome, wearing glasses and a casual light blue shirt. He has a warm, genuine smile and relaxed posture. Neutral light background. Upper body portrait. Warm natural lighting. No text.',
  },
];

async function generateAndSave(patient) {
  console.log(`Generating image for ${patient.id}...`);

  const response = await client.images.generate({
    model: 'gpt-image-1',
    prompt: patient.prompt,
    size: '1024x1024',
    quality: 'medium',
    n: 1,
  });

  const b64 = response.data[0].b64_json;
  const buffer = Buffer.from(b64, 'base64');
  const outPath = join(OUT_DIR, `${patient.id}.jpg`);
  writeFileSync(outPath, buffer);
  console.log(`  Saved → public/patients/${patient.id}.jpg`);
}

for (const patient of PATIENTS) {
  try {
    await generateAndSave(patient);
  } catch (err) {
    console.error(`  Error for ${patient.id}:`, err.message);
  }
}

console.log('\nDone.');
