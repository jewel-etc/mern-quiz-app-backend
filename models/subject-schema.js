const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const subjectSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String},
    creator: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
    topicIds:[{ type: mongoose.Types.ObjectId, required: true, ref: 'Topic' }]


})

module.exports = mongoose.model('Subject', subjectSchema);