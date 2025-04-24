import express from 'express';
import { startBot as realStartBot } from './bot/client';

// Garante que o TypeScript saiba que a função aceita um argumento
const startBot: (cb?: (number: string) => void) => Promise<any> = realStartBot;

import { Server } from 'socket.io';
import http from 'http';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});
const PORT = 5000;

app.get('/start', async (req, res) => {
  try {
    await startBot((number: string) => {
        io.emit('botConnected', number);
      });
      

    res.status(200).send('Bot iniciado com sucesso');
  } catch (error) {
    console.error('Erro ao iniciar o bot:', error);
    res.status(500).send('Erro ao iniciar o bot');
  }
});

server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
