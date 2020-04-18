var mongoose = require('mongoose');
const Telegraf = require('telegraf');
const WizardScene = require('telegraf/scenes/wizard');
const Stage = require('telegraf/stage');
const session = require('telegraf/session')

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

const newTopicScene = new WizardScene(
    'new-topic',
    ctx => {
        ctx.reply('Ok, you want to create a new topic. Enter the name:')
        return ctx.wizard.next();
    },
    ctx => {
        var topic = new Topic({name:ctx.message.text});
        topic.save().then(function(topic){
            ctx.reply(topic.name + ' created successfully.');
            return ctx.scene.leave();
        })
    }
);
const newQuestionScene = new WizardScene(
    'new-question',
    ctx => {
        ctx.wizard.state.topic = ctx.callbackQuery.data.split('/')[1];
        ctx.reply('Write the question that you would like being answerd:')
        return ctx.wizard.next();
    },
    ctx => {
        ctx.wizard.state.question = ctx.message.text;
        var question = new Question(ctx.wizard.state);
        question.save().then(function(question){
            console.log(question.toJSON());
            ctx.reply('question submitted successfully. It will be answered as soon as possible.');
            return ctx.scene.leave();
        })
    }
);

const stage = new Stage([newTopicScene, newQuestionScene], {});

//bot.on('callback_query', getCity);
bot.use(session())
bot.use(stage.middleware());
bot.on('sticker', qaService.showHelp);
bot.action('topics', qaService.topics);
bot.action(qaService.newQuestionFn, qaService.newQuestion);
bot.action(qaService.topicFn, qaService.showQuestions);
bot.action(qaService.questionFn, qaService.showAnswer);

bot.hears(/^/, qaService.showHelp);
bot.catch((err, ctx) => { console.log(`Error for ${ctx.updateType}`, err); });

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
