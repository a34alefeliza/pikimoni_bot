const Markup = require('telegraf/markup')
const _ = require('underscore');

const Topic = require('../model/topic');
const Question = require('../model/question');

module.exports = {

    showHelp: function(ctx){
        console.log('showHelp');
        return ctx.reply(
            'Hi, '+ctx.from.first+'. I can help you with PIKIMONI.',
            Markup.inlineKeyboard([
                Markup.callbackButton("Browse topics", "topics"),
                Markup.callbackButton("Submit a new question", "newQuestion"),
            ]).extra()
        )
    },

    topicFn: function(callbackData) {
        return callbackData.startsWith('topic/')
    },

    showQuestions: function(ctx){
        const queryData = ctx.callbackQuery.data.split('/');
        console.log('showQuestions:'+queryData);
        Question.find({topic:queryData[1]}).then(function(questions){
            var buttons =_.map(questions, function(question){
                return Markup.callbackButton(question.question, 'question/'+question._id);
            })
            return ctx.reply("Here is list of questions for this topic:", 
                Markup.inlineKeyboard(_.chunk(buttons,1)).extra()
            )
        })
    },

    questionFn: function(callbackData) {
        return callbackData.startsWith('question/')
    },

    showAnswer: function(ctx, questionId){
        const queryData = ctx.callbackQuery.data.split('/');
        console.log('showAnswer:'+queryData);
        Question.findById(queryData[1]).then(function(question){
            return ctx.reply("The answer is 42")
        })
    },

    showTopics: function(ctx){
        Topic.find().then(function(topics){
            var buttons =_.map(topics, function(topic){
                return Markup.callbackButton(topic.name, 'topic/'+topic._id);
            })
            return ctx.reply("Pick up one of these topics:", 
                Markup.inlineKeyboard(_.chunk(buttons,1)).extra()
            )
        })
    },

    /**
     * Returns a welcome messge with buttons for all available cities
     * @param context - Telegraf context
     */
    welcomeMessage: function (context) {
        return context.reply(`Hey ${context.from.first_name}!\nSelect a city where you'd like to have a great flat white:`, Extra.markup((m) =>
            m.inlineKeyboard(
                cities.map((city) => m.callbackButton(city.name, city.id))
            )));
    },

    /**
     * Returns the markdown text for the specified city.
     * @param city - the id of the city
     * @param functionDirectory - path to the directory with data files
     */
    getData: function (city, functionDirectory) {
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
    },


    /**
     * Returns a data for the specified city
     * @param context - Telegraf context
     */
    getCity: function (context) {
        const cityId = context.update.callback_query.data;
        const city = cities.filter((city) => city.id === cityId)[0];

        return context.answerCbQuery().then(() => {
            this.getData(city, context.functionDirectory).then((data) => {
                return context.replyWithMarkdown(data, {
                    // do not add preview for links
                    disable_web_page_preview: true,
                });
            });
        });
    }
    
}