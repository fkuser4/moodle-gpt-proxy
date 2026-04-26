export const config = { runtime: 'edge' };

export default async (req) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  try {
    const auth = req.headers.get('authorization');
    const body = await req.json();

    const openai = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': auth,
      },
      body: JSON.stringify(body),
    });

    const data = await openai.json();

    return Response.json(data, {
      status: openai.status,
      headers: cors,
    });
  } catch (e) {
    return Response.json({ error: e.message }, {
      status: 500,
      headers: cors,
    });
  }
};
