import { api } from '../../../core/api/api';

export interface Tag {
    id: number;
    nombre: string;
    color: string;
    descripcion?: string;
}

export interface CreateTagDto {
    nombre: string;
    color: string;
    descripcion?: string;
}

export const tagService = {
    async getMyTags(): Promise<Tag[]> {
        const response = await api.get('/tags');
        return response.data;
    },

    async createTag(data: CreateTagDto): Promise<Tag> {
        const response = await api.post('/tags', data);
        return response.data;
    },

    async updateTag(id: number, data: Partial<CreateTagDto>): Promise<Tag> {
        const response = await api.patch(`/tags/${id}`, data);
        return response.data;
    },

    async deleteTag(id: number): Promise<void> {
        await api.delete(`/tags/${id}`);
    },

    async addTagToTicket(ticketId: number, tagId: number): Promise<void> {
        await api.post(`/tickets/${ticketId}/tags`, { tagId });
    },

    async removeTagFromTicket(ticketId: number, tagId: number): Promise<void> {
        await api.delete(`/tickets/${ticketId}/tags/${tagId}`);
    }
};
