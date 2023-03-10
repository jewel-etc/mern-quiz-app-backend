const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 6 },
    adminPassword: { type: String, require: true, minlength: 8, default: null },
    favSubjectsIds: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Subject' }],
    saveSubjectsIds: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Subject' }],

})

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);