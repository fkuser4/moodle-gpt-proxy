export const config = {
  runtime: 'nodejs',
  maxDuration: 60,
};

const VECTOR_STORE_ID = 'vs_69ee9e6da368819194bc334b05216d80';

const SYSTEM = `Ti si Moodle solver. Imaš pristup materijalima preko file_search alata — uvijek prvo provjeri njih. Ako odgovor nije pokriven materijalima, razmišljaj sam i odgovori najbolje. Output ISKLJUČIVO izvršivi JavaScript kod koji rješava pitanje (klika točne radio buttone, popunjava input polja, itd.). BEZ markdowna, BEZ \`\`\` fences, BEZ objašnjenja, BEZ komentara — samo čisti JS.`;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const json = (status, data) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  try {
    const auth = req.headers.get('authorization');
    if (!auth) return json(401, { error: 'Missing Authorization header' });

    const body = await req.json();
    const { question, model = 'gpt-5.4' } = body;
    if (!question) return json(400, { error: 'Missing question' });

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

    if (!r.ok) return json(r.status, { error: data });

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

    return json(200, { code, usage: data.usage });
  } catch (e) {
    return json(500, { error: e.message });
  }
};
