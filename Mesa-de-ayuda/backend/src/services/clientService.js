import { clientRepository } from '../repositories/clientRepository.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';

export const clientService = {
  getAllClients() {
    return clientRepository.findAll();
  },

  getClientById(id) {
    const client = clientRepository.findById(id);
    if (!client) {
      throw new NotFoundError(`Cliente no encontrado con ID ${id}`);
    }
    return client;
  },

  createClient(data) {
    const existing = clientRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictError(`Ya existe un cliente registrado con el correo '${data.email}'`);
    }
    return clientRepository.create(data);
  },

  updateClient(id, data) {
    this.getClientById(id);

    if (data.email) {
      const existing = clientRepository.findByEmail(data.email);
      if (existing && existing.id !== Number(id)) {
        throw new ConflictError(`El correo '${data.email}' ya pertenece a otro cliente`);
      }
    }

    return clientRepository.update(id, data);
  },

  deleteClient(id) {
    this.getClientById(id);
    try {
      return clientRepository.delete(id);
    } catch (err) {
      if (err.message && err.message.includes('FOREIGN KEY constraint failed')) {
        throw new ConflictError('No se puede eliminar el cliente porque tiene tickets registrados en el sistema');
      }
      throw err;
    }
  }
};
