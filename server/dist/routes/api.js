"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const openai_1 = __importDefault(require("openai"));
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
function auth(req, res, next) {
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
    if (!token)
        return res.status(401).json({ error: 'Missing token' });
    try {
        if (!process.env.JWT_SECRET)
            throw new Error('JWT_SECRET not set');
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        return next();
    }
    catch {
        return res.status(401).json({ error: 'Invalid token' });
    }
}
const openai = process.env.OPENAI_API_KEY
    ? new openai_1.default({ apiKey: process.env.OPENAI_API_KEY })
    : null;
router.post('/ai/translate-mos', auth, async (req, res) => {
    const { mosText } = req.body;
    if (!mosText)
        return res.status(400).json({ error: 'mosText required' });
    if (!openai)
        return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
    const prompt = `Translate this military experience into 3 concise civilian resume bullets:\n\n${mosText}`;
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
    }
    catch (e) {
        return res.status(500).json({ error: 'OpenAI call failed', detail: String(e) });
    }
});
exports.default = router;
//# sourceMappingURL=api.js.map