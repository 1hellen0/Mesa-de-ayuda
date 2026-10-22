import { agentService } from '../services/agentService.js';

export const agentController = {
  getAgents(req, res, next) {
    try {
      const agents = agentService.getAllAgents(req.query);
      return res.status(200).json(agents);
    } catch (err) {
      next(err);
    }
  },

  getAgentById(req, res, next) {
    try {
      const agent = agentService.getAgentById(req.params.id);
      return res.status(200).json(agent);
    } catch (err) {
      next(err);
    }
  },

  createAgent(req, res, next) {
    try {
      const created = agentService.createAgent(req.body);
      return res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  },

  updateAgent(req, res, next) {
    try {
      const updated = agentService.updateAgent(req.params.id, req.body);
      return res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  },

  deleteAgent(req, res, next) {
    try {
      agentService.deleteAgent(req.params.id);
      return res.status(200).json({ mensaje: 'Agente eliminado exitosamente' });
    } catch (err) {
      next(err);
    }
  }
};
