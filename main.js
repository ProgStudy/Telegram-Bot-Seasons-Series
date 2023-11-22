require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');

let bot;
let db;

async function _main() {
    db = await require("./database")();

    bot = new TelegramBot(process.env.API_KEY_BOT, {

        polling: {
          interval: 300,
          autoStart: true
        }
      
    });

    bot.on("polling_error", err => console.log(err));

    bot.on('text', async msg => {

      await bot.sendMessage(msg.chat.id, `Второе меню`, {

        reply_markup: {

                inline_keyboard: [

                    [{text: 'Стикер', callback_data: 'sticker'}, {text: 'Круглое Видео', callback_data: 'circleVideo'}],
                    [{text: 'Купить Файл', callback_data: 'buyFile'}],
                    [{text: 'Проверить Подписку', callback_data: 'checkSubs'}],
                    [{text: 'Закрыть Меню', callback_data: 'closeMenu'}]

                ]

            }

      })
    
    })

    bot.on('callback_query', async ctx => {

        try {
    

            switch(ctx.data) {

              case "closeMenu":
  
                  await bot.deleteMessage(ctx.message.chat.id, ctx.message.message_id);
                  break;
  
          }
    
        }
        catch(error) {
    
            console.log(error);
    
        }
    
    })
}

setTimeout(async () => await _main(), 300);