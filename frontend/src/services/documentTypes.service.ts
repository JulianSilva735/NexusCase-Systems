import { api } from '../api/axios';

export interface DocumentType {
    id: string;
    name: string;
    description: string;
    isMandatory: boolean;
    isActive: boolean;
    allowedFormats: string[]; // e.g. ['PDF', 'JPG']
}

const ENDPOINT = '/document-types';

export const documentTypesService = {
    getAll: async (): Promise<DocumentType[]> => {
        // [MOCK] - Remove when backend is ready
        // return Promise.resolve([
        //   { id: '1', name: 'Cédula', description: 'ID personal', isMandatory: true, requiresFamily: false, applicableStages: ['Inicio', 'Radicado'], templateFilename: 'cedula.docx' }
        // ]);
        const { data } = await api.get(ENDPOINT, {
            headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
            params: { _ts: Date.now() }
        });
        return data;
    },

    create: async (docType: Omit<DocumentType, 'id'>): Promise<DocumentType> => {
        const { data } = await api.post(ENDPOINT, docType);
        return data;
    },

    update: async (id: string, docType: Partial<DocumentType>): Promise<DocumentType> => {
        const { data } = await api.patch(`${ENDPOINT}/${id}`, docType);
        return data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`${ENDPOINT}/${id}`);
    }
};


