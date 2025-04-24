import { create, Whatsapp } from 'venom-bot';

let client: Whatsapp;

interface HostDeviceInfo {
  wid?: {
    user: string;
    server: string;
    _serialized: string;
  };
  [key: string]: any;
}

export async function startBot(onConnected?: (number: string) => void): Promise<Whatsapp> {
  return new Promise((resolve, reject) => {
    create('bot-session', undefined, undefined, {
      headless: 'new',
      disableWelcome: true,
    })
      .then(async (cli: Whatsapp) => {
        client = cli;

        try {
          const info = await client.getHostDevice() as HostDeviceInfo;
          console.log('📦 Info do dispositivo:', info);

          const numero = info?.wid?.user || 'Número não identificado';

          console.log(`🤖 Bot conectado com sucesso! Número: ${numero}`);

          onConnected?.(numero);
        } catch (err) {
          console.error('⚠️ Erro ao obter número do host device:', err);
          onConnected?.('Erro ao capturar número');
        }

        resolve(client);
      })
      .catch((err) => {
        console.error('❌ Erro ao iniciar o bot:', err);
        reject(err);
      });
  });
}

export function getClient(): Whatsapp {
  if (!client) {
    throw new Error('Bot ainda não foi iniciado');
  }
  return client;
}
