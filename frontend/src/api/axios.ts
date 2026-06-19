import axios from 'axios';

/**
 * Instancia de Axios pre-configurada para la API del Backend.
 * baseURL se toma de la variable de entorno VITE_API_URL definida en .env
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

// Interceptor de peticiones: inyecta JWT en cada request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuestas: maneja 401 y 403 globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    if (error.response?.status === 403) {
      // Evento custom capturado por el layout para mostrar Snackbar MUI
      window.dispatchEvent(
        new CustomEvent('nexuscase:forbidden', {
          detail: { message: 'No tienes permisos para realizar esta acción.' },
        })
      );
    }
    return Promise.reject(error);
  }
);
