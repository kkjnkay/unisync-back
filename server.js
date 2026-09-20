const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();

// 🔥 ДОЗВОЛЯЄМО ЗАПИТИ З ІНШИХ ДОМЕНІВ (щоб фронтенд на Vercel міг сюди стукати)
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 🔥 БАЗОВИЙ РОУТ ДЛЯ RENDER (Render буде перевіряти, чи сервер живий)
app.get('/', (req, res) => {
    res.send('UniSync Backend is running! 🚀');
});

// Ендпоінт для перевірки підключення (працює з AddEmailForm.js)
app.post('/check-email', async (req, res) => {
    const { email, appPassword } = req.body;

    if (!email || !appPassword) {
        return res.status(400).send({ success: false, error: 'Введіть email та пароль' });
    }

    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: email,
                pass: appPassword 
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // verify() намагається залогінитись на SMTP сервер
        await transporter.verify();
        
        console.log(`✅ Підключення успішне для: ${email}`);
        res.status(200).send({ success: true, message: 'З\'єднання успішне' });
    } catch (error) {
        console.error(`❌ Помилка перевірки пошти ${email}:`, error.message);
        res.status(401).send({ success: false, error: error.message });
    }
});

// Ендпоінт для відправки розсилки
app.post('/api/send-single', async (req, res) => {
    const { senderAccount, subject, emailData } = req.body;

    // Гнучка перевірка пароля, бо він може зберігатися під різними ключами
    const password = senderAccount?.smtpPassword || senderAccount?.appPassword || senderAccount?.password;

    if (!senderAccount || !senderAccount.email || !password) {
        console.error('❌ Помилка: Неповні дані аккаунта відправника у запиті.');
        return res.status(400).send({ 
            success: false, 
            error: 'Відсутні обов\'язкові дані авторизації (email або пароль) в БД.' 
        });
    }

    try {
        const transporter = nodemailer.createTransport({
            host: senderAccount.smtpHost || 'smtp.gmail.com',
            port: parseInt(senderAccount.smtpPort) || 465,
            secure: parseInt(senderAccount.smtpPort) === 465, 
            auth: {
                user: senderAccount.email,
                pass: password 
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // Формуємо ім'я відправника
        const senderName = `${senderAccount.firstName || ''} ${senderAccount.lastName || ''}`.trim() || 'Розподіл навантаження';

        await transporter.sendMail({
            from: `"${senderName}" <${senderAccount.email}>`,
            to: emailData.to,
            subject: subject,
            html: emailData.htmlBody
        });

        console.log(`✅ Лист успішно надіслано на адресу: ${emailData.to}`);
        res.status(200).send({ success: true, message: 'Лист успішно надіслано' });

    } catch (error) {
        console.error(`❌ Помилка SMTP при спробі відправки для ${emailData.to}:`, error);
        res.status(500).send({ 
            success: false, 
            error: error.message,
            code: error.code
        });
    }
});

// ДИНАМІЧНИЙ ПОРТ ДЛЯ RENDER
const PORT = process.env.PORT || 3001;

// 🔥 Важливо для Render: слухати '0.0.0.0'
app.listen(PORT, '0.0.0.0', () => {
    console.log(`==================================================`);
    console.log(`🚀 Бекенд розсилки UniSync успішно запущено!`);
    console.log(`📡 Сервер очікує на запити на порту: ${PORT}`);
    console.log(`==================================================`);
});