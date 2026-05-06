import type { FastifyInstance } from "fastify";
import { register, login, me } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

export async function authRoutes(app: FastifyInstance) {
    app.post('/auth/register', register);
    app.post('/auth/login', login);
    app.get('/auth/me', { preHandler: authMiddleware }, me);
}