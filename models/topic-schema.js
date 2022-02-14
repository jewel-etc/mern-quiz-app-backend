const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const topicSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String},
    // subjectId: { type: mongoose.Types.ObjectId, required: true, ref: 'Subject' },
    quesAnsIds:[{ type: mongoose.Types.ObjectId, required: true, ref: 'QuesAns' }]


})

module.exports = mongoose.model('Topic', topicSchema);