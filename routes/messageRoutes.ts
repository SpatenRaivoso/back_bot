import { Router } from 'express';
import { sendMessage } from '../controllers/messageController';

const router = Router();

router.post('/send', sendMessage);

export default router;
