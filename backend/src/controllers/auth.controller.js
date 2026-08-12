import { login as loginService } from '../services/auth.service.js';

async function login(req, res, next) {
  try {
    const { nombreUsuario, password } = req.body;

    if (!nombreUsuario || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' });
    }

    const resultado = await loginService(nombreUsuario, password);
    res.status(200).json(resultado);
  } catch (error) {
    next(error); // lo manda al middleware centralizado de errores
  }
}

export { login };