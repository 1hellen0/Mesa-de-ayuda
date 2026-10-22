import { ticketService } from '../services/ticketService.js';

export const ticketController = {
  getTickets(req, res, next) {
    try {
      const tickets = ticketService.getAllTickets(req.query);
      return res.status(200).json(tickets);
    } catch (err) {
      next(err);
    }
  },

  getTicketDetail(req, res, next) {
    try {
      const ticket = ticketService.getTicketDetail(req.params.id);
      return res.status(200).json(ticket);
    } catch (err) {
      next(err);
    }
  },

  createTicket(req, res, next) {
    try {
      const created = ticketService.createTicket(req.body);
      return res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  },

  updateTicket(req, res, next) {
    try {
      const updated = ticketService.updateTicket(req.params.id, req.body);
      return res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  },

  changeStatus(req, res, next) {
    try {
      const updated = ticketService.changeStatus(req.params.id, req.body);
      return res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  },

  getComments(req, res, next) {
    try {
      const comments = ticketService.getTicketComments(req.params.id);
      return res.status(200).json(comments);
    } catch (err) {
      next(err);
    }
  },

  addComment(req, res, next) {
    try {
      const created = ticketService.addComment(req.params.id, req.body);
      return res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  },

  getHistory(req, res, next) {
    try {
      const history = ticketService.getTicketHistory(req.params.id);
      return res.status(200).json(history);
    } catch (err) {
      next(err);
    }
  }
};
