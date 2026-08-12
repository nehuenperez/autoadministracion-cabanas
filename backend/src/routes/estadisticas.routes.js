import { Router } from 'express';
import { verificarToken } from '../middlewares/auth.middleware.js';
import { validarQuery } from '../middlewares/validation.middleware.js';
import { obtener } from '../controllers/estadisticas.controller.js';

const router = Router();

router.use(verificarToken);

router.get('/', validarQuery('queryEstadisticas'), obtener);

export default router;
