import { Telegraf } from 'telegraf';
import Stripe from 'stripe';
import express from 'express';
import bodyParser from 'body-parser';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK = process.env.STRIPE_WEBHOOK_SECRET;
const PRICE_BRL = 29.99;
const PORT = process.env.PORT || 3000;

const bot = new Telegraf(BOT_TOKEN);
const stripe = new Stripe(STRIPE_SECRET);
const app = express();

app.use(bodyParser.raw({ type: 'application/json' }));

const subscriptions = new Map();

bot.start((ctx) => {
  const keyboard = {
    inline_keyboard: [[
      { text: '💎 Ativar Assinatura VIP', callback_data: 'subscribe' }
    ]]
  };
  
  ctx.reply(
    '👋 Bem-vindo ao Bot VIP!\n\n' +
    '✨ Assinatura mensal: R$29,99\n' +
    '📦 Benefícios: Acesso premium completo\n\n' +
    'Clique no botão abaixo para ativar sua assinatura!',
    { reply_markup: keyboard }
  );
});

bot.action('subscribe', async (ctx) => {
  const userId = ctx.from.id;
  const userEmail = ctx.from.username ? `${ctx.from.username}@telegram.user` : `user_${userId}@telegram.user`;
  
  try {
    let customer = await stripe.customers.list({ 
      email: userEmail, 
      limit: 1 
    });
    
    if (customer.data.length === 0) {
      customer = await stripe.customers.create({
        email: userEmail,
        metadata: { 
          telegramId: userId.toString(),
          telegramUsername: ctx.from.username || 'unknown'
        }
      });
    } else {
      customer = customer.data[0];
    }

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: { 
              name: 'Assinatura VIP Telegram',
              description: 'Acesso VIP por 1 mês'
            },
            unit_amount: Math.round(PRICE_BRL * 100),
            recurring: { 
              interval: 'month', 
              interval_count: 1 
            }
          },
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `https://t.me/${(await bot.telegram.getMe()).username}?start=payment_success`,
      cancel_url: `https://t.me/${(await bot.telegram.getMe()).username}?start=payment_cancel`,
      metadata: { 
        telegramId: userId.toString() 
      }
    });

    const paymentKeyboard = {
      inline_keyboard: [[
        { text: '💳 Ir para Pagamento', url: session.url }
      ]]
    };

    await ctx.reply(
      `💳 Link de Pagamento Gerado!\n\n` +
      `💰 Valor: R$${PRICE_BRL}/mês\n` +
      `🔄 Renovação automática\n` +
      `⏱️ Clique no botão para pagar`,
      { reply_markup: paymentKeyboard }
    );

    subscriptions.set(userId, { 
      customerId: customer.id, 
      sessionId: session.id,
      email: userEmail
    });

    console.log(`📱 Link gerado para usuário ${userId}`);
  } catch (error) {
    console.error('Erro ao criar sessão:', error);
    await ctx.reply('❌ Erro ao processar assinatura. Tente novamente.');
  }
});

bot.command('status', async (ctx) => {
  const userId = ctx.from.id;
  const sub = subscriptions.get(userId);
  
  if (sub) {
    await ctx.reply(`✅ Sua assinatura está sendo processada!\nCustomer ID: ${sub.customerId}`);
  } else {
    await ctx.reply('❌ Nenhuma assinatura ativa. Use /start para assinar.');
  }
});

app.post('/webhook', async (req, res) => {
  const signature = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      STRIPE_WEBHOOK
    );

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object;
        const telegramId = subscription.metadata?.telegramId;
        
        if (subscription.status === 'active' && telegramId) {
          await bot.telegram.sendMessage(
            telegramId,
            '✅ Assinatura ativada com sucesso!\n\n' +
            '🎉 Bem-vindo ao VIP!\n' +
            '💎 Você agora tem acesso premium completo.'
          );
          console.log(`✅ Assinatura ativada para ${telegramId}`);
        }
        break;

      case 'customer.subscription.deleted':
        const deletedSub = event.data.object;
        const delTelegramId = deletedSub.metadata?.telegramId;
        
        if (delTelegramId) {
          await bot.telegram.sendMessage(
            delTelegramId,
            '❌ Sua assinatura foi cancelada.\n\n' +
            'Use /start para reativar!'
          );
          console.log(`❌ Assinatura cancelada para ${delTelegramId}`);
        }
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        const customer = await stripe.customers.retrieve(failedInvoice.customer);
        const failTelegramId = customer.metadata?.telegramId;
        
        if (failTelegramId) {
          await bot.telegram.sendMessage(
            failTelegramId,
            '⚠️ Falha no pagamento da sua assinatura.\n\n' +
            'Verifique seu cartão e tente novamente.'
          );
          console.log(`⚠️ Pagamento falhou para ${failTelegramId}`);
        }
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Erro no webhook:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', bot: 'running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server rodando na porta ${PORT}`);
  console.log(`📡 Bot Telegram conectado!`);
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
