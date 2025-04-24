const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

const app = express();
app.use(cors());

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${file.fieldname}${ext}`);
    }
});
const upload = multer({ storage });

let client = null;
let lastQrCode = null;
let isClientReady = false;

// Função que inicia ou conecta ao WhatsApp
const startWhatsApp = () => {
    if (client) return; // Se já existe, não reinicia

    client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
            headless: false,
            args: ['--no-sandbox'],
        }
    });

    client.on('qr', (qr) => {
        lastQrCode = qr;
        console.log('📲 Novo QR Code gerado');
        qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => {
        isClientReady = true;
        lastQrCode = null;
        console.log('✅ WhatsApp está pronto!');
    });

    client.on('disconnected', async (reason) => {
        console.log('🔌 WhatsApp desconectado:', reason);
        isClientReady = false;
        lastQrCode = null;

        // Tenta desconectar e reiniciar de forma segura
        try {
            await client.destroy(); // Encerra a instância anterior
        } catch (err) {
            console.error('Erro ao destruir cliente:', err.message);
        }

        client = null;

        // Aguarda alguns segundos e tenta reiniciar
        setTimeout(() => {
            console.log('♻️ Tentando reconectar o WhatsApp...');
            startWhatsApp();
        }, 5000); // espera 5 segundos para tentar reconectar

        process.on('uncaughtException', (err) => {
            console.error('Erro não tratado:', err);
            // Não derruba o processo
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.error('Rejeição não tratada:', reason);
            // Também evita crash
        });

    });





    try {
        client.initialize();
    } catch (err) {
        console.error('Erro ao iniciar o WhatsApp:', err);
    }

};


app.get('/status', (req, res) => {
    res.json({ connected: isClientReady });
});

app.get('/start-whatsapp', (req, res) => {
    if (isClientReady) {
        return res.json({ status: 'already-connected' });
    }

    startWhatsApp();
    if (lastQrCode) {
        return res.json({ status: 'qr', qr: lastQrCode });
    }

    res.json({ status: 'waiting' });
});

// Envio de mensagens
app.post('/send-messages', upload.single('image'), async (req, res) => {
    const { message } = req.body;
    const numbers = JSON.parse(req.body.numbers);
    const imageFile = req.file;

    if (!numbers || (!message && !imageFile)) {
        return res.status(400).json({ error: 'Faltando mensagem ou imagem' });
    }

    const report = [];

    for (let number of numbers) {
        const phone = number.toString().replace(/\D/g, '');
        if (phone.length < 12) {
            report.push({ number, status: 'número muito curto' });
            continue;
        }

        try {
            const numberId = await client.getNumberId(phone);
            if (!numberId) {
                report.push({ number: phone, status: 'não está no WhatsApp' });
                continue;
            }

            if (imageFile) {
                const media = MessageMedia.fromFilePath(imageFile.path);
                media.mimetype = mime.lookup(imageFile.path) || media.mimetype;
                await client.sendMessage(numberId._serialized, media, { caption: message });
            } else {
                await client.sendMessage(numberId._serialized, message);
            }

            report.push({ number: phone, status: 'mensagem enviada' });
        } catch (err) {
            report.push({ number: phone, status: 'erro ao enviar' });
        }
    }

    if (imageFile && fs.existsSync(imageFile.path)) {
        fs.unlinkSync(imageFile.path);
    }

    res.send({ status: 'Mensagens enviadas', detalhes: report });
});

// Inicia o servidor
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
