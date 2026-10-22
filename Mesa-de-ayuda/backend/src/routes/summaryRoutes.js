import { Router } from 'express';
import { summaryController } from '../controllers/summaryController.js';

const router = Router();

router.get('/resumen', summaryController.getSummary);

export default router;
