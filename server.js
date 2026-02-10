const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.env.PORT || 3000);
const root = __dirname;

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 1_000_000) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

async function generateHandler(req, res) {
  try {
    const { grade = '', subject = '', goal = '', language = 'de' } = await readBody(req);

    const prompt = [
      'You are an expert teaching assistant helping teachers create practical lesson plans.',
      `Output language: ${language}`,
      `Grade: ${grade}`,
      `Subject: ${subject}`,
      `Learning objective/context: ${goal}`,
      'Return: lesson objective, 3-step lesson flow, differentiation tips, and a quick formative assessment.'
    ].join('\n');

    if (!process.env.OPENAI_API_KEY) {
      const fallback = language === 'de'
        ? `Lernziel:\nDie Lernenden verstehen ${subject || 'das Thema'} auf Niveau ${grade || 'passend zur Klasse'}.\n\n3-Phasen-Ablauf:\n1) Einstieg (5-10 Min): Aktivierung von Vorwissen mit Impulsfrage.\n2) Erarbeitung (20 Min): Geführte Übung mit Partnerarbeit zu: ${goal || 'dem Lernziel'}.\n3) Sicherung (10 Min): Ergebnissicherung im Plenum mit Exit-Ticket.\n\nDifferenzierung:\n- Hilfekarten für Basisniveau\n- Erweiterungsaufgabe für schnelle Lernende\n\nFormatives Assessment:\n- 3 kurze Verständnisfragen am Ende der Stunde.`
        : `Objective:\nStudents understand ${subject || 'the topic'} at an appropriate level for grade ${grade || 'class level'}.\n\n3-step flow:\n1) Warm-up (5-10 min): activate prior knowledge with a prompt question.\n2) Practice (20 min): guided partner task aligned to ${goal || 'the learning goal'}.\n3) Reflection (10 min): recap and exit ticket.\n\nDifferentiation:\n- Scaffold cards for support\n- Extension task for advanced learners\n\nFormative assessment:\n- 3 quick understanding checks at lesson end.`;
      return sendJson(res, 200, { output: fallback, source: 'local-fallback', prompt });
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        input: prompt
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return sendJson(res, 502, { error: 'Upstream AI request failed.', detail: errText });
    }

    const data = await response.json();
    return sendJson(res, 200, { output: data.output_text || 'No output returned.', source: 'openai' });
  } catch (error) {
    return sendJson(res, 400, { error: 'Bad request.', detail: String(error) });
  }
}

function serveFile(req, res) {
  const reqPath = req.url === '/' ? '/index.html' : req.url;
  const safePath = path.normalize(reqPath).replace(/^\.\.(\/|\\|$)/, '');
  const filePath = path.join(root, safePath);

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath);
    const type = ext === '.html'
      ? 'text/html; charset=utf-8'
      : ext === '.js'
        ? 'application/javascript; charset=utf-8'
        : ext === '.css'
          ? 'text/css; charset=utf-8'
          : 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/ai/generate') {
    generateHandler(req, res);
    return;
  }

  if (req.method === 'GET') {
    serveFile(req, res);
    return;
  }

  res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Method Not Allowed');
});

server.listen(port, () => {
  console.log(`ai for Teacher server running on http://localhost:${port}`);
});
