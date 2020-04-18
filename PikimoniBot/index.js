var mongoose = require('mongoose');
const Telegraf = require('telegraf');
const Extra = require('telegraf/extra');
const fs = require('fs');
const path = require('path');
const qaService = require('./service/qa');

console.log('Starting the bot...');

const connectionString = 'mongodb://pkm-mongo:DLwjqWBdEJzsv64WkfpxHAIKS92rgKHX853pLkt0bNL75uYe5pV9oTxz1LdrlDp1eCmOveyhEKWTMaPhIPLEoA==@pkm-mongo.mongo.cosmos.azure.com:10255/?ssl=true&appName=@pkm-mongo@';
//const connectionString = 'mongodb://localhost:27018/bot';
var mongoOpts = { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
};
mongoose.connect(connectionString, mongoOpts);

const bot = new Telegraf('1081398486:AAFs2L1OOtRTi321vuNwUrgn7ddMlNoWD4g', { webhookReply: true })
bot.telegram.setWebhook('https://pikimoni-bot.azurewebsites.net/api/PikimoniBot');

bot.on('callback_query', getCity);
bot.on('sticker', qaService.showHelp);
bot.action('topics', qaService.topics);
bot.action('newQuestion', qaService.newQuestion);

bot.hears(/^/, qaService.showHelp);
bot.catch((err, ctx) => { console.log(`Error for ${ctx.updateType}`, err); });

/**
 * Returns the markdown text for the specified city.
 * @param city - the id of the city
 * @param functionDirectory - path to the directory with data files
 */
function getData(city, functionDirectory) {
    return new Promise((resolve, reject) => {
        if (city.data) {
            // return city data from cache
            return resolve(city.data);
        }

        // read city data from a file
        const filePath = path.join(functionDirectory, `${city.id}.md`);
        fs.readFile(filePath, (error, data) => {
            if (error) {
                console.log(error);

                city.data = undefined;
                return resolve('no data :(');
            }

            // save city data to cache
            city.data = data.toString();
            return resolve(city.data);
        });
    });
}

/**
 * Returns a data for the specified city
 * @param context - Telegraf context
 */
function getCity(context) {
    const cityId = context.update.callback_query.data;
    const city = cities.filter((city) => city.id === cityId)[0];

    return context.answerCbQuery().then(() => {
        getData(city, context.functionDirectory).then((data) => {
            return context.replyWithMarkdown(data, {
                // do not add preview for links
                disable_web_page_preview: true,
            });
        });
    });
}

module.exports = async function (context, req) {
    // extend Telegraf context with the data files directory
    bot.context.functionDirectory = context.executionContext.functionDirectory;

    try {
        context.log(req.rawBody);
        console.log(req.rawBody);
        const update = JSON.parse(req.rawBody);

        bot.handleUpdate(update).catch((error) => {
            console.log('Error processing update');
            console.log(error);
        });
    } catch (error) {
        console.error('Error parsing body', error);
        return context.res = {
            body: ""
        };
    }
};
