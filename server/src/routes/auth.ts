import { Router, type Request, type Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = Router();

const credsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post('/register', async (req: Request, res: Response) => {
  const parse = credsSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json(parse.error.format());
  const { email, password } = parse.data;

  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed }, // removed role
    });
    return res.json({ id: user.id, email: user.email });
  } catch (err) {
    return res.status(409).json({ error: 'Email already in use' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  const parse = credsSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json(parse.error.format());
  const { email, password } = parse.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ error: 'Invalid credentials' });

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: 'JWT_SECRET not configured' });
  }

  const token = jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.json({ token });
});

export default router;
