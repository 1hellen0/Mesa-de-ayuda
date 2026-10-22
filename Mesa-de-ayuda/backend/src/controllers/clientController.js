import { clientService } from '../services/clientService.js';

export const clientController = {
  getClients(req, res, next) {
    try {
      const clients = clientService.getAllClients();
      return res.status(200).json(clients);
    } catch (err) {
      next(err);
    }
  },

  getClientById(req, res, next) {
    try {
      const client = clientService.getClientById(req.params.id);
      return res.status(200).json(client);
    } catch (err) {
      next(err);
    }
  },

  createClient(req, res, next) {
    try {
      const created = clientService.createClient(req.body);
      return res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  },

  updateClient(req, res, next) {
    try {
      const updated = clientService.updateClient(req.params.id, req.body);
      return res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  },

  deleteClient(req, res, next) {
    try {
      clientService.deleteClient(req.params.id);
      return res.status(200).json({ mensaje: 'Cliente eliminado exitosamente' });
    } catch (err) {
      next(err);
    }
  }
};
