var mongoose = require('mongoose');
const Telegraf = require('telegraf')
const WizardScene = require('telegraf/scenes/wizard');
const Stage = require('telegraf/stage');
const session = require('telegraf/session')

const _ = require('underscore');

const Topic = require('./model/topic');
const Question = require('./model/question');
const qaService = require('./service/qa');

const bot = new Telegraf('1081398486:AAFs2L1OOtRTi321vuNwUrgn7ddMlNoWD4g', { webhookReply: true })
bot.telegram.setWebhook('https://pikimoni-bot.azurewebsites.net/api/PikimoniBot');

// Log to console middleware
bot.use((ctx, next) => {
	console.log('Message from: ' + ctx.from.username)
	return next()
})

bot.catch((err) => {
	console.log('Unexpected error: ', err);
})

const connectionString = 'mongodb://pkm-mongo:DLwjqWBdEJzsv64WkfpxHAIKS92rgKHX853pLkt0bNL75uYe5pV9oTxz1LdrlDp1eCmOveyhEKWTMaPhIPLEoA==@pkm-mongo.mongo.cosmos.azure.com:10255/?ssl=true&appName=@pkm-mongo@';
//const connectionString = 'mongodb://localhost:27018/bot';
var mongoOpts = { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
};
mongoose.connect(connectionString, mongoOpts).then(function (dbInstance) {

    // Handler factories
    const { enter, leave } = Stage

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
    const browseTopicsScene = new WizardScene(
        'new-question',
        ctx => {
            qaService.showTopics(ctx);
            return ctx.wizard.next();
        },
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

    const stage = new Stage([newTopicScene, browseTopicsScene], {});


    bot.use(session())
    bot.use(stage.middleware());
    bot.start((ctx) => qaService.showHelp(ctx))
    bot.hears('help', (ctx) => qaService.showHelp(ctx))
    bot.action('topics', (ctx) => qaService.showTopics(ctx))
    bot.action('newQuestion', (ctx) => ctx.scene.enter('new-question'))
    bot.action(qaService.topicFn, (ctx) => qaService.showQuestions(ctx))
    bot.action(qaService.questionFn, (ctx) => qaService.showAnswer(ctx))
    bot.command('newtopic', (ctx) => ctx.scene.enter('new-topic'))
    bot.launch()

})