var mongoose = require('mongoose');
var schema = mongoose.Schema({
    name: { type: String, required: true },
    createdBy: String,
    creationDate: Date
});
module.exports = mongoose.model('Topic', schema);