import { summaryRepository } from '../repositories/summaryRepository.js';

export const summaryService = {
  getSummary() {
    return summaryRepository.getSummary();
  }
};
