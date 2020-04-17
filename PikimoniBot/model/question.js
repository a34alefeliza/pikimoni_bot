var mongoose = require('mongoose');
var schema = mongoose.Schema({
	topic: { type: String, ref: 'Topic', required: true },
    question: { type: String, required: true },
    createdBy: String,
    creationDate: Date
});
module.exports = mongoose.model('Question', schema);