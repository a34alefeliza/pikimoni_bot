var mongoose = require('mongoose');
const Telegraf = require('telegraf');
const Extra = require('telegraf/extra');
const fs = require('fs');
const path = require('path');
const _ = require('underscore');

const Topic = require('./model/topic');
const Question = require('./model/question');
const qaService = require('./service/qa');

console.log('Starting the bot...');

const cities = [
    {
        name: 'Amsterdam',
        id: 'Amsterdam',
    },
    {
        name: 'Berlin',
        id: 'Berlin',
    },
    {
        name: 'Lisbon',
        id: 'Lisbon',
    },
    {
        name: 'Minsk',
        id: 'Minsk',
    },
];

const bot = new Telegraf('1081398486:AAFs2L1OOtRTi321vuNwUrgn7ddMlNoWD4g', { webhookReply: true })
bot.telegram.setWebhook('https://pikimoni-bot.azurewebsites.net/api/PikimoniBot');

const connectionString = 'mongodb://pkm-mongo:DLwjqWBdEJzsv64WkfpxHAIKS92rgKHX853pLkt0bNL75uYe5pV9oTxz1LdrlDp1eCmOveyhEKWTMaPhIPLEoA==@pkm-mongo.mongo.cosmos.azure.com:10255/?ssl=true&appName=@pkm-mongo@';
//const connectionString = 'mongodb://localhost:27018/bot';
var mongoOpts = { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
};
mongoose.connect(connectionString, mongoOpts).then(function (dbInstance) {
    bot.on('callback_query', qaService.getCity);
    bot.on('sticker', qaService.welcomeMessage);
    bot.hears(/^/, qaService.welcomeMessage);
    bot.catch((err, ctx) => { console.log(`Error for ${ctx.updateType}`, err); });
})

module.exports = async function (context, req) {
    // extend Telegraf context with the data files directory
    bot.context.functionDirectory = context.executionContext.functionDirectory;

    try {
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
