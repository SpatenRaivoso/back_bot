import { getClient } from '../bot/client';
import { formatNumber } from '../utils/formatNumber';

export const sendMessageToClient = async (number: string, message: string) => {
  const client = getClient();
  const formattedNumber = formatNumber(number); 
  await client.sendText(formattedNumber, message);
};
