const HttpError = require('../models/http-error.js');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const User = require('../models/user-schema.js');
const Subject = require('../models/subject-schema.js');
const Topic = require('../models/topic-schema.js');
const Unit = require('../models/unit-schema.js');
const QuesAns = require('../models/quesAns-schema.js');




//1.create topic by subject Id

const createTopicBySubjectId = async (req, res, next) => {

    const errroOnValidation = validationResult(req);
    let subject, topicName, topicDes;

    if (!errroOnValidation.isEmpty()) {
        const validationError = new HttpError('Invalid inputs', 422);
        return next(validationError);

    }
    const { name, description, id } = req.body;

    const subjectId = id;
    // console.log("subject=",subjectId);


    try {
        subject = await Subject.findById(subjectId);

    } catch (err) {
        const error = new HttpError('Creating topic failed', 500);
        return next(error);

    }

    if (!subject) {
        const error = new HttpError('Could not find subject', 404);
        return next(error);
    }



    topicName = name.toLowerCase().split(' ').map(x => x[0].toUpperCase() + x.slice(1)).join(' ');
    topicDes = description.charAt(0).toUpperCase() + description.slice(1);


    const createdTopic = new Topic({
        name: topicName,
        description: topicDes,
        // subjectId,
        quesAnsIds: []
    })



    if (subject.creator.toString() !== req.userData.userId || !req.userData.isAdmin) {
        const error = new HttpError('Not allowed to create topic', 404);
        return next(error);

    }

    try {

        const sess = await mongoose.startSession();
        sess.startTransaction();
        
        await subject.topicIds.push(createdTopic);
        await createdTopic.save();
        await subject.save();
        await sess.commitTransaction();

    } catch (err) {
        const error = new HttpError('Creating topic failed', 500);
        return next(error);

    }



    res.json({ topic: createdTopic.toObject({ getters: true }) }) //toObject convert to normal object & gettres true omit _

}

//2. get all topics and units  by subject id
const getTopicsAndUnitsBySubjectId = async (req, res, next) => {
    const subjectId = req.params.subjectId;

    let subject, topics, topicsIds = [], units, user;

    try {
        subject = await Subject.findById(subjectId);       
        topics = await Topic.find({ _id: subject.topicIds });
       

    } catch (err) {
        const error = new HttpError('Fetching topics  failed...', 500);
        return next(error);

    }


    if (!subject || !topics) {
        const error = new HttpError('Could not find subject', 404);
        return next(error);
    }



    for (let i = 0; i < topics.length; i++) {
        topicsIds[i] = topics[i].id
    }


    //find units

    try {

        units = await Unit.find({ topicId: topicsIds })

    } catch (err) {
        const error = new HttpError('Fetching units failed..', 500);
        return next(error);


    }

    if (!units) {
        const error = new HttpError('No units found', 500);
        return next(error);

    }




    res.json({
        topics: topics.map(topic => topic.toObject({ getters: true })),
        units: units.map(unit => unit.toObject({ getters: true }))


    })
};


//3.Edit topic by topic id

const updateTopicByTopicId = async (req, res, next) => {

    const errroOnValidation = validationResult(req);
    let updateTopic;

    if (!errroOnValidation.isEmpty()) {
        const validationError = new HttpError('Invalid inputs', 422);
        return next(validationError);

    }

    const { name, description, updateItemId } = req.body;

    const topicId = updateItemId;

    try {
        updateTopic = await Topic.findById(topicId);

    } catch (err) {
        const error = new HttpError('Update topic failed..', 500);
        return next(error);

    }


    if (!updateTopic) {
        const error = new HttpError('Could not find topic', 404);
        return next(error);

    }

    //check subject creator to authenticate user

    let subject;
    try {
        subject = await Subject.findOne({ topicIds:  topicId });

    } catch (err) {

        const error = new HttpError('Update topic failed', 500);
        return next(error);

    }

    if (!subject) {
        const error = new HttpError('Could not find subject', 400);
        return next(error);

    }

    if (subject.creator.toString() !== req.userData.userId || !req.userData.isAdmin) {
        const error = new HttpError('Not allowed to create topic', 404);
        return next(error);

    }
    let topicName, topicDes;
    topicName = name.toLowerCase().split(' ').map(x => x[0].toUpperCase() + x.slice(1)).join(' ');
    topicDes = description.charAt(0).toUpperCase() + description.slice(1);
    updateTopic.name = topicName;
    updateTopic.description = topicDes;

    try {
        await updateTopic.save();

    } catch (err) {
        const error = new HttpError('Update Topic failed', 500);
        return next(error);

    }

    res.json({ message: 'Update Completed' })

}

//4. Delete topic by topic id

const deleteTopicByTopicId = async (req, res, next) => {



    const topicId = req.body.deleteItemId;

    let deleteTopic, deleteUnits, deleteUnitsIds = [], deleteQuesAnswers;

    try {
        deleteTopic = await Topic.findById(topicId);
        deleteUnits = await Unit.find({ topicId: deleteTopic.id });

        for (let i = 0; i < deleteUnits.length; i++)
            deleteUnitsIds.push(deleteUnits[i].id);

    } catch (err) {
        const error = new HttpError('Delete topic failed', 500);
        return next(error);

    }



    if (!deleteTopic) {
        const error = new HttpError('Could not find topic', 404);
        return next(error);

    }



    if (!deleteUnits) {
        const error = new HttpError('Could not find unit', 404);
        return next(error);

    }





    //check subject creator to authenticate user


    let subject;
    try {
        subject = await Subject.findOne({ topicIds:  topicId });

    } catch (err) {

        const error = new HttpError('Update topic failed', 500);
        return next(error);

    }


    if (!subject) {
        const error = new HttpError('Could not find subject', 400);
        return next(error);

    }

    if (subject.creator.toString() !== req.userData.userId || !req.userData.isAdmin) {
        const error = new HttpError('Not allowed to delete topic', 404);
        return next(error);

    }

    // topic, unit ,quesAns  delete


    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        subject.topicIds.pull(topicId);
        await QuesAns.deleteMany({ unitId: deleteUnitsIds, session: sess });
        await Unit.deleteMany({ topicId: deleteTopic.id, session: sess });
        await deleteTopic.deleteOne({ session: sess });
        await subject.save();
        await sess.commitTransaction();

    } catch (err) {
        const error = new HttpError('Could not delete topic', 500);
        return next(error);

    }
    res.json({
        message: "Topic Deleted.."
    })

}



module.exports = {
    createTopicBySubjectId,
    getTopicsAndUnitsBySubjectId,
    updateTopicByTopicId,
    deleteTopicByTopicId

}