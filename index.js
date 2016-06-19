const Botkit = require('botkit');
const localtunnel = require('localtunnel');

if (!process.env.FB_PAGE_TOKEN) {
  console.log('Error: Specify FB_PAGE_TOKEN in environment');
  process.exit(1);
}

if (!process.env.FB_VERIFY_TOKEN) {
  console.log('Error: Specify FB_VERIFY_TOKEN in environment');
  process.exit(1);
}

const controller = Botkit.facebookbot({
  debug: !!process.env.BOT_DEBUG,
  access_token: process.env.FB_PAGE_TOKEN,
  verify_token: process.env.FB_VERIFY_TOKEN,
});

const bot = controller.spawn({
});

controller.setupWebserver(process.env.port || 3000, (err, webserver) => {
  controller.createWebhookEndpoints(webserver, bot, () => {
    console.log('ONLINE!');
    if (process.env.BOT_LT) {
      const ltOpts = process.env.BOT_LTSUBDOMAIN ? { subdomain: process.env.BOT_LTSUBDOMAIN } : {};
      const tunnel = localtunnel(process.env.port || 3000, ltOpts, (error, newTunnel) => {
        if (error) {
          process.exit();
        }
        const msg = `Your bot is available at ${newTunnel.url}/facebook/receive`;
        console.log(msg);
      });

      tunnel.on('close', () => {
        console.log('Your bot is no longer available on the web at the localtunnnel.me URL.');
        process.exit();
      });
    }
  });
});

controller.hears(['hello', 'hi'], 'message_received', (fbBot, message) => {
  fbBot.reply(message, 'Hello to you too!');
});

controller.on('message_received', (fbBot, message) => {
  fbBot.reply(message, 'I have received your message');
  return false;
});
