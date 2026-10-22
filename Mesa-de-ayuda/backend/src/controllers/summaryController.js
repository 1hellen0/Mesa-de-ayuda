import { summaryService } from '../services/summaryService.js';

export const summaryController = {
  getSummary(req, res, next) {
    try {
      const summary = summaryService.getSummary();
      return res.status(200).json(summary);
    } catch (err) {
      next(err);
    }
  }
};
