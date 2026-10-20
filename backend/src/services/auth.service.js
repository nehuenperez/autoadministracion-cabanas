import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Usuario } from '../models/index.js';

class AuthError extends Error {
  constructor(mensaje, status) {
    super(mensaje);
    this.status = status;
  }
}

async function login(nombreUsuario, password) {
  const usuario = await Usuario.findOne({ where: { nombreUsuario } });

  if (!usuario) {
    throw new AuthError('Usuario o contraseña incorrectos', 401);
  }

  const passwordValida = await bcrypt.compare(password, usuario.passwordHash);

  if (!passwordValida) {
    throw new AuthError('Usuario o contraseña incorrectos', 401);
  }

  const token = jwt.sign(
    { id: usuario.id, nombreUsuario: usuario.nombreUsuario }, // payload: sin password, sin datos sensibles
    process.env.JWT_SECRET,
    // Sin el fallback, si JWT_EXPIRES_IN no está cargada jwt.sign() tira y
    // todos los logins terminan en un 500.
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );

  return { token, usuario: { id: usuario.id, nombreUsuario: usuario.nombreUsuario } };
}

export { login, AuthError };