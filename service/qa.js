const Markup = require('telegraf/markup')
const _ = require('underscore');

const Topic = require('../model/topic');
const Question = require('../model/question');

module.exports = {

    showHelp: function(ctx){
        ctx.reply(
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
            ctx.reply("Here is list of questions for this topic:", 
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
            ctx.reply("The answer is 42")
        })
    },

    showTopics: function(ctx){
        Topic.find().then(function(topics){
            var buttons =_.map(topics, function(topic){
                return Markup.callbackButton(topic.name, 'topic/'+topic._id);
            })
            ctx.reply("Pick up one of these topics:", 
                Markup.inlineKeyboard(_.chunk(buttons,1)).extra()
            )
        })
    },

}