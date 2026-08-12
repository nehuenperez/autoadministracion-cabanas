import { Router } from 'express';
import { login } from '../controllers/auth.controller.js';
import { validarBody } from '../middlewares/validation.middleware.js';

const router = Router();

router.post('/login', validarBody('login'), login);

export default router;
