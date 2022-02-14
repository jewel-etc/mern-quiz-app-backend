const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const unitSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String},
    topicId: { type: mongoose.Types.ObjectId, required: true, ref: 'Topic' },


})

module.exports = mongoose.model('Unit', unitSchema);