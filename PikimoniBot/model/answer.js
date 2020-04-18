var mongoose = require('mongoose');
var schema = mongoose.Schema({
	question: { type: String, ref: 'Question', required: true },
    answer: { type: String, required: true },
    createdBy: String,
    creationDate: Date
});
module.exports = mongoose.model('Answer', schema);