
const mongoose = require('mongoose');
const HttpError = require('../models/http-error.js');
const { validationResult } = require('express-validator');
const Subject = require('../models/subject-schema.js');
const Topic = require('../models/topic-schema.js');
const Unit = require('../models/unit-schema.js');
const QuesAns = require('../models/quesAns-schema.js');



//1.create quesAns by unit Id

const createQuesAnsByUnitId = async (req, res, next) => {

    const errroOnValidation = validationResult(req);
    let unit, topic, subject;

    if (!errroOnValidation.isEmpty()) {
        const validationError = new HttpError('Invalid inputs', 422);
        return next(validationError);
    }


    const { description, question, option1, option2, option3, option4, correctOption, explanation, id } = req.body;
    const unitId = id;


    //find unit
    try {
        unit = await Unit.findById(unitId);
        topic = await Topic.findOne({ _id: unit.topicId });
        subject = await Subject.findOne({ topicIds: unit.topicId });

    } catch (err) {
        const error = new HttpError('Create quesAns failed..', 500);
        return next(error);

    }




    if (!unit || !topic || !subject) {
        const error = new HttpError('Could not find ', 404);
        return next(error);
    }


    if (subject.creator.toString() !== req.userData.userId || !req.userData.isAdmin) {
        const error = new HttpError('Not allowed to create unit', 404);
        return next(error);

    }

    let options = [
        option1.toUpperCase(),
        option2.toUpperCase(),
        option3.toUpperCase(),
        option4.toUpperCase()
    ];

    let correct=correctOption.toUpperCase();
    let rightOption = options.includes(correct)
    let allOptionUnique = !options.some((option, i) => options.indexOf(option) < i);


    if (!allOptionUnique) {

        const error = new HttpError('4 options must unique', 404);
        return next(error);
        
    }

    else if (!rightOption) {
        const error = new HttpError('Correct option must be from one of the options', 404);
        return next(error);
       
    }


    const createdQuesAns = new QuesAns({

        description,
        question,
        option1,
        option2,
        option3,
        option4,
        correctOption,
        explanation,
        unitId


    })

    //add qusAnsIds o topic schema with session


    try {

        const sess = await mongoose.startSession();
        sess.startTransaction();
        await createdQuesAns.save();
        topic.quesAnsIds.push(createdQuesAns);
        await topic.save();
        await sess.commitTransaction();

    } catch (err) {
        const error = new HttpError('Creating quesAns failed', 500);
        return next(error);

    }
    res.json({ quesAns: createdQuesAns.toObject({ getters: true }) })

}


//2. get all created quesAns by unit id

const getQuesAnsByUnitId = async (req, res, next) => {
    const unitId = req.params.unitId;
    const userId = req.body.userId;

    let unit, quesAnswers;
    //find unit
    try {
        unit = await Unit.findById(unitId);

    } catch (err) {
        const error = new HttpError('Fetching quesAns failed..', 500);
        return next(error);

    }



    if (!unit) {
        const error = new HttpError('Could not find unit', 404);
        return next(error);
    }

    //find quesAns for this unitId

    try {
        quesAnswers = await QuesAns.find({ unitId: unitId });


    } catch (err) {

        const error = new HttpError('Fetching quesAns failed..', 500);
        return next(error);

    }

    if (userId !== req.userData.userId) {
        const error = new HttpError('Not allowed to fetch ques ans', 404);
        return next(error);

    }

    if (!quesAnswers) {
        const error = new HttpError('Could not find quesAns', 404);
        return next(error);
    }

    res.json({
        quesAnswers: quesAnswers.map(qA => qA.toObject({ getters: true }))


    })


};





//3.Edit quesAns by quesAns id

const updateQuesAnsByQuesAnsId = async (req, res, next) => {

    const errroOnValidation = validationResult(req);

    if (!errroOnValidation.isEmpty()) {
        const validationError = new HttpError('Invalid inputs', 422);
        return next(validationError);


    }
    const { description, question, option1, option2, option3, option4, correctOption, explanation, updateItemId } = req.body;
    const quesAnsId = updateItemId;
    let updateQuesAns, unit, topic, subject;


    //find quesAns

    try {
        updateQuesAns = await QuesAns.findById(quesAnsId);
        unit = await Unit.findOne({ _id: updateQuesAns.unitId });
        topic = await Topic.findOne({ _id: unit.topicId });
        subject = await Subject.findOne({ topicIds: unit.topicId });

    } catch (err) {
        const error = new HttpError('Update quesAns failed..', 500);
        return next(error);

    }


    if (!updateQuesAns || !unit || !topic || !subject) {
        const error = new HttpError('Could not find ', 404);
        return next(error);

    }

    //check subject creator to authenticate user

    if (subject.creator.toString() !== req.userData.userId || !req.userData.isAdmin) {
        const error = new HttpError('Not allowed to create unit', 404);
        return next(error);

    }

    updateQuesAns.description = description;
    updateQuesAns.question = question;
    updateQuesAns.option1 = option1;
    updateQuesAns.option2 = option2;
    updateQuesAns.option3 = option3;
    updateQuesAns.option4 = option4;
    updateQuesAns.correctOption = correctOption;
    updateQuesAns.explanation = explanation;


    try {
        await updateQuesAns.save();

    } catch (err) {
        const error = new HttpError('Update quesAns failed', 500);
        return next(error);

    }

    res.json({ message: 'Update Completed' })



}


//4. Delete quesAns by quesAns id

const deleteQuesAnsByQuesAnsId = async (req, res, next) => {

    const quesAnsId = req.body.deleteItemId;

    let deleteQuesAns, unit, topic, subject;

    try {
        deleteQuesAns = await QuesAns.findById(quesAnsId);
        unit = await Unit.findOne({ _id: deleteQuesAns.unitId });
        topic = await Topic.findOne({ _id: unit.topicId });
        subject = await Subject.findOne({ topicIds: unit.topicId });

    } catch (err) {
        const error = new HttpError('Delete quesAns failed', 500);
        return next(error);

    }

    if (!deleteQuesAns || !unit || !topic || !subject) {
        const error = new HttpError('Could not find ', 404);
        return next(error);

    }



    if (!deleteQuesAns || !unit || !topic || !subject) {
        const error = new HttpError('Could not find ', 404);
        return next(error);

    }

    //check subject creator to authenticate user

    if (subject.creator.toString() !== req.userData.userId || !req.userData.isAdmin) {
        const error = new HttpError('Not allowed to delete Ques & Answers', 404);
        return next(error);

    }



    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await topic.quesAnsIds.pull(quesAnsId);
        await deleteQuesAns.remove();
        await topic.save();
        await sess.commitTransaction();

    } catch (err) {
        const error = new HttpError('Could not delete question...', 500);
        return next(error);

    }
    res.json({
        message: "QuesAns Deleted.."
    })


}


module.exports = {

    getQuesAnsByUnitId,
    createQuesAnsByUnitId,
    updateQuesAnsByQuesAnsId,
    deleteQuesAnsByQuesAnsId
};
