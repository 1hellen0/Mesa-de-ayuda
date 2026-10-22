import { Router } from 'express';
import { agentController } from '../controllers/agentController.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { agentIdParamSchema, createAgentSchema, updateAgentSchema } from '../validators/agentValidator.js';

const router = Router();

router.get('/', agentController.getAgents);
router.get('/:id', validateRequest({ params: agentIdParamSchema }), agentController.getAgentById);
router.post('/', validateRequest({ body: createAgentSchema }), agentController.createAgent);
router.put('/:id', validateRequest({ params: agentIdParamSchema, body: updateAgentSchema }), agentController.updateAgent);
router.patch('/:id', validateRequest({ params: agentIdParamSchema, body: updateAgentSchema }), agentController.updateAgent);
router.delete('/:id', validateRequest({ params: agentIdParamSchema }), agentController.deleteAgent);

export default router;
