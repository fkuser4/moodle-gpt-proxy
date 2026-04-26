export const config = {
  runtime: 'nodejs',
  maxDuration: 60,
};

const VECTOR_STORE_ID = 'vs_69ee9e6da368819194bc334b05216d80';

const SYSTEM = `Ti si Moodle solver. Imaš pristup materijalima preko file_search alata — uvijek prvo provjeri njih. Ako odgovor nije pokriven materijalima, razmišljaj sam i odgovori najbolje. Output ISKLJUČIVO izvršivi JavaScript kod koji rješava pitanje (klika točne radio buttone, popunjava input polja, itd.). BEZ markdowna, BEZ \`\`\` fences, BEZ objašnjenja, BEZ komentara — samo čisti JS.`;

const setCors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

const send = (res, status, data) => {
  setCors(res);
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = status;
  res.end(JSON.stringify(data));
};

const readJson = (req) =>
  new Promise((resolve, reject) => {
    let buf = '';
    req.on('data', (chunk) => (buf += chunk));
    req.on('end', () => {
      try {
        resolve(buf ? JSON.parse(buf) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });

export default async (req, res) => {
  if (req.method === 'OPTIONS') {
    setCors(res);
    res.statusCode = 204;
    return res.end();
  }

  try {
    const auth = req.headers['authorization'];
    if (!auth) return send(res, 401, { error: 'Missing Authorization header' });

    const body = await readJson(req);
    const { question, model = 'gpt-5.4' } = body;
    if (!question) return send(res, 400, { error: 'Missing question' });

    const payload = {
      model,
      instructions: SYSTEM,
      input: question,
      tools: [
        {
          type: 'file_search',
          vector_store_ids: [VECTOR_STORE_ID],
        },
      ],
      reasoning: { effort: 'high' },
    };

    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
      },
      body: JSON.stringify(payload),
    });

    const data = await r.json();

    if (!r.ok) return send(res, r.status, { error: data });

    let code = data.output_text || '';
    if (!code && Array.isArray(data.output)) {
      for (const item of data.output) {
        if (item.type === 'message' && Array.isArray(item.content)) {
          for (const c of item.content) {
            if (c.type === 'output_text' && c.text) code += c.text;
          }
        }
      }
    }

    code = code
      .replace(/^```[a-z]*\n?/i, '')
      .replace(/\n?```$/i, '')
      .trim();

    return send(res, 200, { code, usage: data.usage });
  } catch (e) {
    return send(res, 500, { error: e.message });
  }
};
