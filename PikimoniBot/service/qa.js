const Markup = require('telegraf/markup')
const _ = require('underscore');
const Extra = require('telegraf/extra');
const fs = require('fs');
const path = require('path');
const Topic = require('../model/topic');
const Question = require('../model/question');
const Answer = require('../model/answer');
const WizardScene = require('telegraf/scenes/wizard');
const Stage = require('telegraf/stage');

module.exports = {

    showHelp: function(ctx){
        console.log('showHelp');
        return ctx.reply(
            'Hi! I can help you with PIKIMONI.',
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
            if (questions.length){
                var buttons =_.map(questions, function(question){
                    return Markup.callbackButton(question.question, 'question/'+question._id);
                })
                buttons.push(Markup.callbackButton('Submit a new question', 'newQuestion/'+queryData[1]));
                return ctx.reply("Here is list of questions for this topic:", 
                    Markup.inlineKeyboard(_.chunk(buttons,1)).extra()
                )
            } else {
                return ctx.reply("No questions yet.", 
                    Markup.inlineKeyboard(
                        [Markup.callbackButton('Submit a new question', 'newQuestion/'+queryData[1])]
                    ).extra()
                )
            }
        })
    },

    questionFn: function(callbackData) {
        return callbackData.startsWith('question/')
    },

    showAnswers: function(ctx){
        const queryData = ctx.callbackQuery.data.split('/');
        Question.findById(queryData[1]).then(function(question){
            Answer.find({question:question._id}).then(function(answers){
                if (answers.length){
                    var md='# '+question.question+'\n';
                    _.each(answers, function(answer){
                        md=md+'\n'+answer.answer+'\n';
                    })
                    return ctx.replyWithMarkdown(md, 
                        Markup.inlineKeyboard([
                            Markup.callbackButton('Add an answer', 'newAnswer/'+question._id),
                            Markup.callbackButton('Back', 'topic/'+question.topic)
                        ]
                        ).extra()
                    )
                } else {
                    return ctx.reply("No answers yet.", 
                        Markup.inlineKeyboard(
                            [Markup.callbackButton('Add an answer', 'newAnswer/'+queryData[1])]
                        ).extra()
                    )
                }
            })
        })
    },

    answerFn: function(callbackData) {
        return callbackData.startsWith('newAnswer/')
    },

    newAnswer: function(ctx){
        ctx.scene.enter('new-answer');
    },
    
    topics: function(ctx){
        Topic.find().then(function(topics){
            var buttons =_.map(topics, function(topic){
                return Markup.callbackButton(topic.name, 'topic/'+topic._id);
            })
            return ctx.reply("Pick up one of these topics:", 
                Markup.inlineKeyboard(_.chunk(buttons,1)).extra()
            )
        })
    },

    newQuestionFn: function(callbackData){
        return callbackData.startsWith('newQuestion/')
    },
    
    newQuestion: function(ctx){
        ctx.scene.enter('new-question');
    },

    newTopic: function(ctx){
        ctx.scene.enter('new-topic');
    },

    /**
     * Returns a welcome messge with buttons for all available cities
     * @param context - Telegraf context
     */
    welcomeMessage: function (context) {
        var cities=[
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
        ]
    
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
    },

    
    
    
}