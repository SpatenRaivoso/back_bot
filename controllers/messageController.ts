import { Request, Response } from 'express';
import { sendMessageToClient } from '../services/messageService';

export const sendMessage = async (req: Request, res: Response) => {
  const { number, message } = req.body;

  try {
    await sendMessageToClient(number, message);
    res.status(200).json({ success: true, message: 'Mensagem enviada' });
  } catch (error) {
    res.status(500).json({ success: false, error });
  }
};
