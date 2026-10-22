import { agentRepository } from '../repositories/agentRepository.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';

export const agentService = {
  getAllAgents(filters) {
    return agentRepository.findAll(filters);
  },

  getAgentById(id) {
    const agent = agentRepository.findById(id);
    if (!agent) {
      throw new NotFoundError(`Agente no encontrado con ID ${id}`);
    }
    return agent;
  },

  createAgent(data) {
    const existing = agentRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictError(`Ya existe un agente registrado con el correo '${data.email}'`);
    }
    return agentRepository.create(data);
  },

  updateAgent(id, data) {
    this.getAgentById(id);

    if (data.email) {
      const existing = agentRepository.findByEmail(data.email);
      if (existing && existing.id !== Number(id)) {
        throw new ConflictError(`El correo '${data.email}' ya pertenece a otro agente`);
      }
    }

    return agentRepository.update(id, data);
  },

  deleteAgent(id) {
    this.getAgentById(id);
    try {
      return agentRepository.delete(id);
    } catch (err) {
      if (err.message && err.message.includes('FOREIGN KEY constraint failed')) {
        throw new ConflictError('No se puede eliminar el agente porque tiene tickets históricos asociados a su gestión');
      }
      throw err;
    }
  }
};
