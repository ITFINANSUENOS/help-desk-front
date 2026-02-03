import { AxiosError, type AxiosResponse } from 'axios';

/**
 * Manejador de éxito para respuestas.
 * Simplemente pasa la respuesta tal cual.
 */
export const responseSuccessHandler = (response: AxiosResponse) => response;

/**
 * Manejador de errores global para respuestas.
 * 
 * Detecta errores 401 (No autorizado) y podría redirigir al login
 * o limpiar el almacenamiento local.
 * 
 * @param error Error de Axios.
 * @returns Promesa rechazada con el error.
 */
export const responseErrorHandler = (error: AxiosError) => {
    const status = error.response?.status;
    const data = error.response?.data as any;

    // Default error details
    let title = 'Error';
    let message = 'Ha ocurrido un error inesperado.';
    let variant: 'error' | 'info' | 'success' = 'error';
    let shouldShowModal = false;

    if (status === 401) {
        // console.warn('Sesión expirada o inválida. Redirigiendo...');
        // localStorage.removeItem('token');
        // window.location.href = '/login';
    } else if (status === 403) {
        title = 'Acceso Denegado';
        message = data?.message || 'No tienes permisos para realizar esta acción.';
        shouldShowModal = true;
    } else if (status === 404) {
        title = 'Recurso no encontrado';
        message = data?.message || 'El recurso solicitado no existe.';
        variant = 'info';
        shouldShowModal = true;
    } else if (status === 400) {
        title = 'Datos Inválidos';
        shouldShowModal = true;
        if (Array.isArray(data?.message)) {
            // Join validation errors with newlines
            message = data.message.join('\n');
        } else {
            message = data?.message || 'La solicitud contiene datos inválidos.';
        }
    }

    if (shouldShowModal) {
        const event = new CustomEvent('global-api-error', {
            detail: {
                title,
                message,
                variant
            }
        });
        window.dispatchEvent(event);
    }

    return Promise.reject(error);
};
