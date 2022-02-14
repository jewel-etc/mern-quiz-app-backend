const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const quesAnsSchema = new Schema({
    
    description: { type: String, required: true },
    question: { type: String, required: true },
    option1: { type: String, required: true },
    option2: { type: String, required: true },
    option3: { type: String, required: true },
    option4: { type: String, required: true },
    correctOption: { type: String, required: true },
    explanation: { type: String},
    unitId: { type: mongoose.Types.ObjectId, required: true, ref: 'Unit' },

})

module.exports = mongoose.model('QuesAns', quesAnsSchema);