import { api } from '../api/axios';

export const documentsService = {
    /**
     * Sube un documento asociado a un caso y un tipo de documento.
     */
    upload: async ({ caseId, documentTypeId, file }: { caseId: string, documentTypeId: string, file: File }) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentTypeId', documentTypeId);
        formData.append('caseId', caseId);

        const { data } = await api.post('/documents/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return data; // Debería retornar { id: '...', url: '...' }
    }
};


