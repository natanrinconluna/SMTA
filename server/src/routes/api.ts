import { Router, type Request, type Response, type NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import OpenAI from 'openai';

const prisma = new PrismaClient();
const router = Router();

type JwtUser = { sub: string; role?: string; email?: string; [k: string]: unknown };

function auth(req: Request & { user?: JwtUser }, res: Response, next: NextFunction) {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });

  try {
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET not set');
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtUser;
    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

router.post('/ai/translate-mos', auth, async (req: Request, res: Response) => {
  const { mosText } = req.body as { mosText?: string };
  if (!mosText) return res.status(400).json({ error: 'mosText required' });
  if (!openai) return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });

  const prompt =
    `Translate this military experience into 3 concise civilian resume bullets:\n\n${mosText}`;

  try {
    const out = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const content = out.choices[0]?.message?.content ?? '';
    const bullets = content
      .split(/\r?\n/)
      .map((s) => s.replace(/^[-•\d.)\s]+/, '').trim())
      .filter(Boolean)
      .slice(0, 3);

    return res.json({ bullets, raw: content });
  } catch (e) {
    return res.status(500).json({ error: 'OpenAI call failed', detail: String(e) });
  }
});

export default router;
