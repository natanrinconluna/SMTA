"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
const credsSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
router.post('/register', async (req, res) => {
    const parse = credsSchema.safeParse(req.body);
    if (!parse.success)
        return res.status(400).json(parse.error.format());
    const { email, password } = parse.data;
    try {
        const hashed = await bcrypt_1.default.hash(password, 10);
        const user = await prisma.user.create({
            data: { email, password: hashed }, // removed role
        });
        return res.json({ id: user.id, email: user.email });
    }
    catch (err) {
        return res.status(409).json({ error: 'Email already in use' });
    }
});
router.post('/login', async (req, res) => {
    const parse = credsSchema.safeParse(req.body);
    if (!parse.success)
        return res.status(400).json(parse.error.format());
    const { email, password } = parse.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt_1.default.compare(password, user.password)))
        return res.status(401).json({ error: 'Invalid credentials' });
    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ error: 'JWT_SECRET not configured' });
    }
    const token = jsonwebtoken_1.default.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token });
});
exports.default = router;
//# sourceMappingURL=auth.js.map