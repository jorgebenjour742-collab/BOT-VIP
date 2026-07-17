import { Telegraf, Markup } from 'telegraf';
import express from 'express';
import bodyParser from 'body-parser';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || ''; // Será configurado depois
const PORT = process.env.PORT || 3000;

const bot = new Telegraf(BOT_TOKEN);
const app = express();

app.use(bodyParser.json());

// Store user data during registration
const userSessions = new Map();

// Menu Principal
const mainMenuKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('👨‍💼 Área do Revendedor', 'reseller_area')],
  [Markup.button.callback('🎯 Projeto 2026 Revendedores', 'program_2026')],
  [Markup.button.callback('📦 Solicite novo pedido de mercadoria', 'order_request')],
  [Markup.button.callback('💬 Suporte', 'support')]
]);

// Área do Revendedor submenu
const resellerAreaKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('🧀 Produtos para revender', 'products')],
  [Markup.button.callback('📱 Portfólio digital', 'portfolio')],
  [Markup.button.callback('📣 Materiais de divulgação', 'materials')],
  [Markup.button.callback('🎓 Curso de técnicas de venda', 'course')],
  [Markup.button.callback('⬅️ Voltar ao Menu', 'main_menu')]
]);

// /start command
bot.start((ctx) => {
  ctx.reply(
    '🌽 Bem-vindo ao Rancho de Minas!\n\n' +
    'Descubra oportunidades de negócio e acesse nossos produtos.\n\n' +
    'O que você gostaria de fazer?',
    mainMenuKeyboard
  );
});

// Main Menu
bot.action('main_menu', (ctx) => {
  ctx.editMessageText(
    '🌽 Menu Principal - Rancho de Minas\n\n' +
    'Escolha uma opção:',
    mainMenuKeyboard
  );
});

// Reseller Area
bot.action('reseller_area', (ctx) => {
  ctx.editMessageText(
    '👨‍💼 Área do Revendedor\n\n' +
    'Acesse nossos recursos:',
    resellerAreaKeyboard
  );
});

// Products
bot.action('products', (ctx) => {
  ctx.editMessageText(
    '🧀 Produtos para Revender\n\n' +
    'Conheça nossa linha completa de produtos:\n\n' +
    '• Queijos artesanais\n' +
    '• Derivados de leite\n' +
    '• Produtos especiais sazonais\n\n' +
    'Para mais informações, use o comando /suporte',
    Markup.inlineKeyboard([
      [Markup.button.callback('⬅️ Voltar', 'reseller_area')]
    ])
  );
});

// Portfolio
bot.action('portfolio', (ctx) => {
  ctx.editMessageText(
    '📱 Portfólio Digital\n\n' +
    'Acesse nosso portfólio digital completo com:\n\n' +
    '• Catálogo de produtos\n' +
    '• Fotos em alta resolução\n' +
    '• Descrições detalhadas\n' +
    '• Links para compartilhar\n\n' +
    'Baixe em: https://portfolio.ranchominas.com.br',
    Markup.inlineKeyboard([
      [Markup.button.callback('⬅️ Voltar', 'reseller_area')]
    ])
  );
});

// Materials
bot.action('materials', (ctx) => {
  ctx.editMessageText(
    '📣 Materiais de Divulgação\n\n' +
    'Materiais prontos para você usar:\n\n' +
    '• Banners para redes sociais\n' +
    '• Posts prontos\n' +
    '• Templates de vídeo\n' +
    '• Flyers em PDF\n\n' +
    'Acesse: https://materiais.ranchominas.com.br',
    Markup.inlineKeyboard([
      [Markup.button.callback('⬅️ Voltar', 'reseller_area')]
    ])
  );
});

// Course
bot.action('course', (ctx) => {
  ctx.editMessageText(
    '🎓 Curso de Técnicas de Venda\n\n' +
    'Aprenda com nossos especialistas:\n\n' +
    '• Técnicas de vendas consultivas\n' +
    '• Gestão de relacionamento com clientes\n' +
    '• Estratégias de precificação\n' +
    '• Como aumentar sua margem de lucro\n\n' +
    'Curso online gratuito para revendedores!',
    Markup.inlineKeyboard([
      [Markup.button.callback('⬅️ Voltar', 'reseller_area')]
    ])
  );
});

// Program 2026
bot.action('program_2026', (ctx) => {
  ctx.editMessageText(
    '🎯 Projeto 2026 Revendedores\n\n' +
    '💰 Por apenas R$ 259,99\n\n' +
    'Você pode dar o primeiro passo para entrar no programa e receber um:\n\n' +
    '🎁 Kit de Ativação Comercial com valor comercial de até R$ 2.000,00 em produtos Rancho de Minas\n\n' +
    '🛠️ Ferramentas para começar a divulgar e vender\n\n' +
    '📈 Suporte exclusivo para revendedores\n\n' +
    'Não perca essa oportunidade!',
    Markup.inlineKeyboard([
      [Markup.button.callback('✅ Quero Entrar no Programa', 'start_registration')],
      [Markup.button.callback('⬅️ Voltar', 'main_menu')]
    ])
  );
});

// Start Registration
bot.action('start_registration', (ctx) => {
  const userId = ctx.from.id;
  userSessions.set(userId, { step: 'cpf' });
  
  ctx.reply(
    '📋 Formulário de Inscrição\n\n' +
    'Passo 1 de 4\n\n' +
    'Por favor, digite seu CPF (apenas números):'
  );
});

// Collect CPF
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const session = userSessions.get(userId);

  if (!session || !session.step) return;

  const userText = ctx.message.text.trim();

  switch (session.step) {
    case 'cpf':
      if (!/^\d{11}$/.test(userText.replace(/\D/g, ''))) {
        return ctx.reply('❌ CPF inválido. Digite apenas 11 números.\nExemplo: 12345678901');
      }
      session.cpf = userText.replace(/\D/g, '');
      session.step = 'name';
      ctx.reply('✅ CPF recebido!\n\nPasso 2 de 4\n\nDigite seu nome completo:');
      break;

    case 'name':
      if (userText.length < 5) {
        return ctx.reply('❌ Nome muito curto. Digite seu nome completo.');
      }
      session.name = userText;
      session.step = 'phone';
      ctx.reply('✅ Nome recebido!\n\nPasso 3 de 4\n\nDigite seu telefone (com DDD):\nExemplo: (31) 99999-9999');
      break;

    case 'phone':
      if (!/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(userText)) {
        return ctx.reply('❌ Telefone inválido.\nFormato correto: (31) 99999-9999 ou 31999999999');
      }
      session.phone = userText;
      session.step = 'address';
      ctx.reply('✅ Telefone recebido!\n\nPasso 4 de 4\n\nDigite seu endereço completo:\n(Rua, número, bairro, cidade, estado)');
      break;

    case 'address':
      if (userText.length < 10) {
        return ctx.reply('❌ Endereço muito curto. Digite o endereço completo.');
      }
      session.address = userText;
      session.step = 'complete';

      // Display registration summary
      const summary = 
        `📋 Resumo da Inscrição\n\n` +
        `✅ CPF: ${session.cpf}\n` +
        `✅ Nome: ${session.name}\n` +
        `✅ Telefone: ${session.phone}\n` +
        `✅ Endereço: ${session.address}\n\n` +
        `💰 Valor do Programa: R$ 259,99\n\n`;

      ctx.reply(
        summary,
        Markup.inlineKeyboard([
          [Markup.button.callback('💳 Confirmar e Pagar', 'confirm_payment')],
          [Markup.button.callback('❌ Cancelar', 'main_menu')]
        ])
      );

      // Send data to admin
      if (ADMIN_CHAT_ID) {
        await bot.telegram.sendMessage(
          ADMIN_CHAT_ID,
          `📝 NOVA INSCRIÇÃO - Projeto 2026\n\n` +
          `👤 Usuário: @${ctx.from.username || ctx.from.id}\n` +
          `📱 Telegram ID: ${userId}\n\n` +
          summary +
          `⏳ Aguardando confirmação de pagamento`
        );
      }

      break;

    default:
      break;
  }
});

// Confirm Payment
bot.action('confirm_payment', (ctx) => {
  const userId = ctx.from.id;
  const session = userSessions.get(userId);

  if (!session) {
    return ctx.reply('Sessão expirada. Comece novamente com /start');
  }

  ctx.editMessageText(
    `💳 Dados para Pagamento\n\n` +
    `Valor: R$ 259,99\n\n` +
    `📌 Instruções de Pagamento:\n\n` +
    `1️⃣ Escolha o método de pagamento:\n` +
    `   • PIX\n` +
    `   • Transferência Bancária\n` +
    `   • Boleto\n\n` +
    `2️⃣ Os dados de pagamento serão enviados\n` +
    `   pelo administrador em breve\n\n` +
    `3️⃣ Aguarde a confirmação de seu pagamento\n\n` +
    `✉️ Você receberá uma mensagem assim que\n` +
    `confirmarmos seu pagamento!`,
    Markup.inlineKeyboard([
      [Markup.button.callback('⬅️ Voltar', 'main_menu')]
    ])
  );

  // Notify admin to send payment info
  if (ADMIN_CHAT_ID) {
    bot.telegram.sendMessage(
      ADMIN_CHAT_ID,
      `💰 PAGAMENTO AGUARDANDO\n\n` +
      `Usuário: @${ctx.from.username || ctx.from.id}\n` +
      `ID: ${userId}\n` +
      `Nome: ${session.name}\n` +
      `CPF: ${session.cpf}\n` +
      `Telefone: ${session.phone}\n` +
      `Endereço: ${session.address}\n\n` +
      `⚠️ AÇÃO NECESSÁRIA:\n` +
      `Envie os dados de pagamento para este usuário\n` +
      `(PIX, Transferência ou Boleto)`
    );
  }
});

// Order Request
bot.action('order_request', (ctx) => {
  ctx.editMessageText(
    '📦 Solicite novo pedido de mercadoria\n\n' +
    'Para fazer um pedido de mercadoria:\n\n' +
    '📞 Entre em contato conosco:\n' +
    '   Telefone: (31) 3XXX-XXXX\n' +
    '   WhatsApp: (31) 99XXX-XXXX\n\n' +
    '📧 Email: pedidos@ranchominas.com.br\n\n' +
    '💬 Ou envie uma mensagem aqui com:\n' +
    '   • Quais produtos deseja\n' +
    '   • Quantidades\n' +
    '   • Prazos desejados',
    Markup.inlineKeyboard([
      [Markup.button.callback('⬅️ Voltar', 'main_menu')]
    ])
  );
});

// Support
bot.action('support', (ctx) => {
  ctx.editMessageText(
    '💬 Suporte Rancho de Minas\n\n' +
    'Dúvidas? Estamos aqui para ajudar!\n\n' +
    '📞 Telefone: (31) 3XXX-XXXX\n' +
    '📱 WhatsApp: (31) 99XXX-XXXX\n' +
    '📧 Email: suporte@ranchominas.com.br\n\n' +
    'Horário de atendimento:\n' +
    'Segunda a Sexta: 08h às 18h\n' +
    'Sábado: 08h às 12h\n\n' +
    '💡 Dica: Você também pode escrever sua dúvida\n' +
    'aqui mesmo que responderemos em breve!',
    Markup.inlineKeyboard([
      [Markup.button.callback('⬅️ Voltar', 'main_menu')]
    ])
  );
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', bot: 'Rancho de Minas' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Bot Rancho de Minas rodando na porta ${PORT}`);
});

// Start bot
bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
