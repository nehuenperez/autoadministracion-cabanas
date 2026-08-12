import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  // Render (plan gratuito) apaga el servicio tras 15 min sin uso y el primer
  // pedido tiene que esperar a que arranque de nuevo. 60s da margen para ese
  // "cold start" sin dejar la app colgada para siempre si el server no responde.
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si el token venció o es inválido, el backend responde 401. Sin esto la sesión
// quedaba "a medias": el usuario seguía guardado en localStorage pero ninguna
// llamada funcionaba. Limpiamos la sesión y mandamos al login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const esLlamadaDeLogin = error.config?.url?.includes('/auth/login');

    if (error.response?.status === 401 && !esLlamadaDeLogin) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }

    return Promise.reject(error);
  }
);

export default api;
