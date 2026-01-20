import { api } from './api';
import type { Category } from '../interfaces/Category';

export const categoryService = {
    async getCategories(): Promise<Category[]> {
        // Using ?filter[estado]=1 to get only active categories
        const response = await api.get<Category[]>('/categories', {
            params: {
                'filter[estado]': 1,
                sort: 'nombre'
            }
        });
        // The API might return { data: [...] } or just [...] depending on pagination. 
        // Based on API.md for other endpoints, it seems to use pagination standard.
        // Let's assume for a dropdown we might want to increase limit or fetch all.
        // If the API returns a paginated structure, we need to handle it.
        // For now, let's assume the API returns the array or we handle the .data property if it exists.
        // Type assertion might be needed if the return type is not strictly just RequestResponse<Category[]>
        // Checking ticket.service, we used response.data directly but typed it as TicketListResponse.

        // Let's inspect the response structure from another service or assume array for list.
        // Actually, API.md says GET /categories supports pagination.
        // So response.data will likely be { data: Category[], meta: ... } OR just Category[] if pagination is disabled?
        // Type assertion for wrapped response structure
        const data = response.data as unknown as { data: Category[] };
        return Array.isArray(response.data) ? response.data : (data.data || []);
    }
};
