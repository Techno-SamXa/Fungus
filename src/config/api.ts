// Configuración de API para diferentes entornos

/**
 * Obtiene la URL base de la API según el entorno
 * En desarrollo: http://localhost:8000
 * En producción: /api (rutas relativas)
 */
export const getApiBaseUrl = (): string => {
  return import.meta.env.DEV ? 'http://localhost:8000' : '/api';
};

/**
 * Construye una URL completa para un endpoint de la API
 * @param endpoint - El endpoint de la API (ej: '/products', '/auth/login')
 * @returns URL completa para el endpoint
 */
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  // Asegurar que el endpoint comience con /
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

/**
 * Construye una URL completa para una imagen
 * @param imagePath - Ruta de la imagen (ej: '/uploads/image.jpg')
 * @returns URL completa para la imagen
 */
export const getImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath) return null;
  
  // Si ya es una URL completa, devolverla tal como está
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Para imágenes, usar la URL base con /api en producción
  const baseUrl = import.meta.env.DEV ? 'http://localhost:8000' : 'https://fungusmycelium.cl/api';
  // Asegurar que la ruta comience con /
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${baseUrl}${cleanPath}`;
};

/**
 * Headers comunes para las peticiones autenticadas
 * @param token - Token de autenticación (opcional)
 * @returns Headers object
 */
export const getAuthHeaders = (token?: string | null): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

/**
 * Realiza una petición autenticada a la API
 * @param endpoint - Endpoint de la API
 * @param options - Opciones de fetch
 * @returns Promise con la respuesta
 */
export const apiRequest = async (endpoint: string, options: any = {}): Promise<Response> => {
  const token = localStorage.getItem('auth_token');
  const url = getApiUrl(endpoint);
  
  const defaultOptions: RequestInit = {
    ...options,
  };
  
  // Si es FormData, no establecer Content-Type (el navegador lo hará automáticamente)
  if (options.isFormData || options.body instanceof FormData) {
    defaultOptions.headers = {
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.headers,
    };
  } else {
    // Para JSON y otros tipos de contenido
    defaultOptions.headers = {
      ...getAuthHeaders(token),
      ...options.headers,
    };
  }
  
  return fetch(url, defaultOptions);
};