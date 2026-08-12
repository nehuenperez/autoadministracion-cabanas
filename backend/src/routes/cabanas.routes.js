import { Router } from 'express';
import { verificarToken } from '../middlewares/auth.middleware.js';
import { listar } from '../controllers/cabanas.controller.js';

const router = Router();

router.use(verificarToken);

router.get('/', listar);

export default router;