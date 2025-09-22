"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const morgan_1 = __importDefault(require("morgan"));
// Mount your routers
const auth_1 = __importDefault(require("./routes/auth"));
const app = (0, express_1.default)();
// Hide tech fingerprint & add standard security headers
app.disable('x-powered-by');
app.use((0, helmet_1.default)({
    // Disable CSP by default to avoid blocking your SPA assets; tune later if needed.
    contentSecurityPolicy: false,
}));
// Request logging (dev-friendly locally, combined in prod)
app.use((0, morgan_1.default)(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
// Tighten body size to avoid accidental DoS
app.use(express_1.default.json({ limit: '1mb' }));
// CORS: same-origin is fine; if you split hosts, set ALLOWED_ORIGIN in .env
const allowed = process.env.ALLOWED_ORIGIN;
app.use(allowed ? (0, cors_1.default)({ origin: allowed, credentials: true }) : (0, cors_1.default)());
// Basic rate limiting (IP-based) for all routes
app.use((0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // 300 requests / 15min per IP
    standardHeaders: true,
    legacyHeaders: false,
}));
// --- API routes ---
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/auth', auth_1.default);
// --- Serve the built client (client/dist) ---
const clientDist = path_1.default.resolve(__dirname, '../../client/dist');
app.use(express_1.default.static(clientDist));
// Express v5-safe SPA fallback: any non-API/ auth GET -> index.html
app.use((req, res, next) => {
    if (req.method !== 'GET')
        return next();
    if (req.path.startsWith('/api') || req.path.startsWith('/auth'))
        return next();
    res.sendFile(path_1.default.join(clientDist, 'index.html'));
});
const port = Number(process.env.PORT) || 4000;
app.listen(port, () => console.log(`API + SPA on http://localhost:${port}`));
//# sourceMappingURL=index.js.map