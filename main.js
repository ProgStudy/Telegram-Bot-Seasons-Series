require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');

let bot;
let db;

const commands = [
  {

      command: "start",
      description: "Основное меню"

  }
]

async function _main() {
    db = await require("./database")();

    bot = new TelegramBot(process.env.API_KEY_BOT, {

        polling: {
          interval: 300,
          autoStart: true
        }
      
    });

    bot.on("polling_error", err => console.log(err));
  
    bot.setMyCommands(commands);

    bot.on('video', async video => {
      //чтобы не париться с админкой, мы будем добавлять видео следующим путем
      //каждое имя файла будет соответствовать с file_id
      
      if (video.from.id != process.env.ADMIN_USER_UPLOAD_ID) {
        return;
      }
      
      let name = video.video.file_name
      let parts = name.split('.')[0].split('_');

      if (parts.length < 3) {
        await bot.sendMessage(video.chat.id, 'Не верный формат название файла который пытались загрузить (' + name + '). Он должен называться примерно так: `Любое название_Название сезона_Название серии.mp4`');
        return;
      }
      
      let movie = await db('movies').where('name', parts[0]).first();
      
      if (!movie) {
        await db('movies').insert({name: parts[0]});
        movie = await db('movies').where('name', parts[0]).first();
      }
      
      let season = await db('seasons').where('movie_id', movie.id).where('name', parts[1]).first();
      if (!season) {
        await db('seasons').insert({name: parts[1], movie_id: movie.id});
        season = await db('seasons').where('movie_id', movie.id).where('name', parts[1]).first();
      }

      let serie = await db('series').where('season_id', season.id).where('name', parts[2]).first();
      if (!serie) {
        await db('series').insert({name: parts[2], season_id: season.id, telegram_file_id: video.video.file_id});
        serie = await db('series').where('season_id', season.id).where('name', parts[2]).first();
      }

      await db('series').where('season_id', season.id).where('name', parts[2]).update({telegram_file_id: video.video.file_id});
    });

    bot.on('text', async msg => {
      if(msg.text.startsWith('/start')) {
        //перед тем как запускать бота, нужно проверить , подписан ли чувак на канал , иначе ему предлагаем подписаться
        
        let subscribe = await bot.getChatMember(process.env.CHANNEL_CHAT_ID, msg.from.id);
        
        if (subscribe.status == 'left' || subscribe.status == 'kicked') {

            await bot.sendMessage(msg.chat.id, `Чтобы начать пользоваться ботом, подпишись на канал <b>https://t.me/vksimpson</b> !`, {
      
                parse_mode: 'HTML'
      
            });

            return;
        }

        //если это наш подписчик, то даем разрешение на авторизацию
        let user = await db('users').where('telegram_id', msg.from.id).first();

        if (!user) {
          await db('users').insert({'telegram_id': msg.from.id});

          user = await db('users').where('telegram_id', msg.from.id).first();
        }

        // тут подгружаем стартовое меню
        showMenuMovies(msg);

        return;
      }

    });

    bot.on('callback_query', async ctx => {
        try {
            let args = ctx.data.split('-');
            

            if (args[0] == 'selectMovie') {
              // выбрали сериал
              let id = args[1];

              await db('users').where('telegram_id', ctx.from.id).update({select_movie_id: id});

              await showMenuSeasons(ctx);

              return;
            }

            if (args[0] == 'selectSeason') {
              // выбрали сезон
              let id = args[1];

              await db('users').where('telegram_id', ctx.from.id).update({select_seasons_id: id});

              await showMenuSeries(ctx);

              return;
            }

            if (args[0] == 'selectSerie') {
              // выбрали серию
              let id = args[1];

              await db('users').where('telegram_id', ctx.from.id).update({select_series_id: id});

              await showVideo(ctx);

              return;
            }

            if (args[0] == 'backToSeries') {
              // возвращаемся в меню c сериями
              await showMenuSeries(ctx);

              return;
            }

            if (args[0] == 'backToSeasons') {
              // возвращаемся в меню с сезонами
              await showMenuSeasons(ctx);

              return;
            }

            if (args[0] == 'backToMovies') {
              // возвращаемся в меню с сериалами
              await showMenuMovies(ctx, true);

              return;
            }

            if (args[0] == 'closeVideo') {
              bot.deleteMessage(ctx.message.chat.id, ctx.message.message_id);
              return;
            }
        }
        catch(error) {
            console.log(error);
        }
    
    })
}

async function showMenuMovies(msg, isMenu = false) {
  let movies = await db('movies').where('has_active', 1);
  let list = [];

  movies.forEach(item => {
    list.push([{text: item.name, callback_data: `selectMovie-${item.id}`}]);
  });

  let messageId = isMenu ? msg.message.message_id : msg.message_id;
  let chatId = isMenu ? msg.message.chat.id : msg.chat.id;

  await bot.deleteMessage(chatId, messageId);

  await bot.sendMessage(chatId, `Выберите сериал`, {
      reply_markup: {
          inline_keyboard: list
      },
  });
}

async function showMenuSeasons(msg) {
  let user = await db('users').where('telegram_id', msg.from.id).first();
  let seasons = await db('seasons').where('has_active', 1).where('movie_id', user.select_movie_id);
  let list = [];

  seasons.forEach(item => {
    list.push([{text: item.name, callback_data: `selectSeason-${item.id}`}]);
  });

  list.push([{text: 'Назад', callback_data: 'backToMovies'}])

  await bot.deleteMessage(msg.message.chat.id, msg.message.message_id);

  await bot.sendMessage(msg.message.chat.id, `Выберите сезон`, {
      reply_markup: {
          inline_keyboard: list
      }
  });
}

async function showMenuSeries(msg) {
  let user = await db('users').where('telegram_id', msg.from.id).first();
  let series = await db('series').where('has_active', 1).where('season_id', user.select_seasons_id);
  let list = [];

  series.forEach(item => {
    list.push([{text: item.name, callback_data: `selectSerie-${item.id}`}]);
  });

  list.push([{text: 'Назад', callback_data: 'backToSeasons'}]);

  await bot.deleteMessage(msg.message.chat.id, msg.message.message_id);

  await bot.sendMessage(msg.message.chat.id, `Выберите серию`, {
      reply_markup: {
          inline_keyboard: list
      },
  });
}

async function showVideo(msg) {
  let user = await db('users').where('telegram_id', msg.from.id).first();
  let movie = await db('movies').where('has_active', 1).where('id', user.select_movie_id).first();
  let season = await db('seasons').where('has_active', 1).where('id', user.select_seasons_id).first();
  let serie = await db('series').where('has_active', 1).where('id', user.select_series_id).first();
  
  let list = [[{text: 'Закрыть', callback_data: 'closeVideo'}]];

  await showMenuSeries(msg);

  await bot.sendDocument(msg.message.chat.id, serie.telegram_file_id, {
      reply_markup: {
          inline_keyboard: list
      },
      caption: `${movie.name} | ${season.name} | ${serie.name}`
  });
}

setTimeout(async () => await _main(), 300);