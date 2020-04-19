const Markup = require('telegraf/markup')
const Topic = require('../model/topic');
const Question = require('../model/question');
const Answer = require('../model/answer');

const _ = require('underscore');

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
                    var md='*'+question.question+'*\n';
                    _.each(answers, function(answer){
                        md=md+'\n'+answer.answer+'\n';
                    })
                    return ctx.replyWithMarkdown(md, 
                        Markup.inlineKeyboard([
                            Markup.callbackButton('Add an answer', 'newAnswer/'+question._id),
                            Markup.callbackButton('Back', 'topic/'+question.topic)
                        ]).extra()
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

    inlineQuery: function(ctx){
        if (ctx.inlineQuery.query=='topics'){
            Topic.find().then(function(topics){
                var results = _.map(topics, function(topic){
                    return {
                        type: 'article',
                        id: topic._id,
                        title: topic.name,
                        input_message_content: {
                            message_text: topic.name
                        },
                        reply_markup: Markup.inlineKeyboard([
                            Markup.callbackButton(topic.name, 'topic/'+topic._id)
                        ])
                    }
                })
                return ctx.answerInlineQuery(results);
            })
        }
    },

    start: function(ctx){
        if (ctx.message.text.startsWith('/start newAnswer')){
            ctx.scene.enter('new-answer');
        }
    }
}