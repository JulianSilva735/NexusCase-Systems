import { DocumentsController } from './documents.controller';

describe('DocumentsController lifecycle auto recalculate', () => {
  const documentsService = {
    create: jest.fn(),
    generateDocumentFromTemplate: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findOne: jest.fn(),
  };

  const lifecycleService = {
    recalculate: jest.fn(),
  };

  let controller: DocumentsController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new DocumentsController(documentsService as any, lifecycleService as any);
  });

  it('recalcula lifecycle al actualizar documento', async () => {
    documentsService.update.mockResolvedValue({ id: 'doc-1' });
    documentsService.findOne.mockResolvedValue({ id: 'doc-1', case: { id: 'case-1' } });

    await controller.update('doc-1', { status: 'APPROVED' } as any, { user: { id: 'u1' } } as any);

    expect(lifecycleService.recalculate).toHaveBeenCalledWith('case-1', { id: 'u1' });
  });

  it('recalcula lifecycle al eliminar documento', async () => {
    documentsService.findOne.mockResolvedValue({ id: 'doc-1', case: { id: 'case-1' } });
    documentsService.remove.mockResolvedValue({ affected: 1 });

    await controller.remove('doc-1', { user: { id: 'u1' } } as any);

    expect(lifecycleService.recalculate).toHaveBeenCalledWith('case-1', { id: 'u1' });
  });
});
