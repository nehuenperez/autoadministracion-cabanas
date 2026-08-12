import api from './api.js';

async function login(nombreUsuario, password) {
  const { data } = await api.post('/auth/login', { nombreUsuario, password });
  return data;
}

export { login };