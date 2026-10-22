import { Router } from 'express';
import { clientController } from '../controllers/clientController.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { clientIdParamSchema, createClientSchema, updateClientSchema } from '../validators/clientValidator.js';

const router = Router();

router.get('/', clientController.getClients);
router.get('/:id', validateRequest({ params: clientIdParamSchema }), clientController.getClientById);
router.post('/', validateRequest({ body: createClientSchema }), clientController.createClient);
router.put('/:id', validateRequest({ params: clientIdParamSchema, body: updateClientSchema }), clientController.updateClient);
router.patch('/:id', validateRequest({ params: clientIdParamSchema, body: updateClientSchema }), clientController.updateClient);
router.delete('/:id', validateRequest({ params: clientIdParamSchema }), clientController.deleteClient);

export default router;
