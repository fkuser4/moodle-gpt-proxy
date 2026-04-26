import OpenAI from 'openai';
import fs from 'node:fs';
import path from 'node:path';

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('Postavi OPENAI_API_KEY env var. Npr.:');
  console.error('  OPENAI_API_KEY=sk-... npm run upload -- ~/Downloads/skripta.pdf');
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: npm run upload -- <file1> [file2 ...]');
  console.error('Primjer: npm run upload -- ~/Downloads/*.pdf');
  process.exit(1);
}

const files = args.map((p) => path.resolve(p.replace(/^~/, process.env.HOME)));
for (const f of files) {
  if (!fs.existsSync(f)) {
    console.error('Fajl ne postoji:', f);
    process.exit(1);
  }
}

const client = new OpenAI({ apiKey });

const existingId = process.env.VECTOR_STORE_ID;
let storeId;
if (existingId) {
  console.log('Dodajem fajlove na postojeći vector store:', existingId);
  storeId = existingId;
} else {
  console.log('Kreiram novi vector store...');
  const store = await client.vectorStores.create({ name: 'moodle-knowledge' });
  storeId = store.id;
  console.log('Vector store ID:', storeId);
}

for (const f of files) {
  const name = path.basename(f);
  process.stdout.write(`Uploadam ${name}... `);
  try {
    const result = await client.vectorStores.files.uploadAndPoll(
      storeId,
      fs.createReadStream(f),
    );
    console.log(result.status);
  } catch (e) {
    console.log('FAIL:', e.message);
  }
}

console.log('\nGotovo.');
console.log('\nHardkodiraj ovaj ID u api/index.mjs (VECTOR_STORE_ID konstanta):');
console.log(`  ${storeId}`);
