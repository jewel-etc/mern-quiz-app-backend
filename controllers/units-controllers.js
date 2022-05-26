
const HttpError = require('../models/http-error.js');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');


const Subject = require('../models/subject-schema.js');
const Topic = require('../models/topic-schema.js');
const Unit = require('../models/unit-schema.js');
const QuesAns = require('../models/quesAns-schema.js');




//1.create topic by subject Id

const createUnitByTopictId = async (req, res, next) => {
    const errroOnValidation = validationResult(req);
    let topic,subject;

    if (!errroOnValidation.isEmpty()) {
        const validationError = new HttpError('Invalid inputs', 422);
        return next(validationError);


    }
    const { name, description, id } = req.body;
    const topicId = id;

    //find topic
    try {
        topic = await Topic.findById(topicId);
        subject = await Subject.findOne({ topicIds: topicId });

    } catch (err) {
        const error = new HttpError('Create unit failed..', 404);
        return next(error);

    }


    if (!topic || !subject) {
        const error = new HttpError('Could not find ', 404);
        return next(error);
    }


    if (subject.creator.toString() !== req.userData.userId || !req.userData.isAdmin) {
        const error = new HttpError('Not allowed to create unit', 404);
        return next(error);

    }

    let unitName,unitDes;
    unitName = name.toLowerCase().split(' ').map(x => x[0].toUpperCase() + x.slice(1)).join(' ');
    unitDes= description.charAt(0).toUpperCase() + description.slice(1);


    const createdUnit = new Unit({
        name: unitName,
        description:unitDes,
        topicId
    })

    try {
        await createdUnit.save()

    } catch (err) {
        const error = new HttpError('Creating unit failed', 500);
        return next(error);

    }

    res.json({ unit: createdUnit.toObject({ getters: true }) }) //toObject convert to normal object & gettres true omit _


}

//1.5 load units by topic id

const fetchUnitsByTopicId = async (req, res, next) => {

    const topicId = req.params.topicId;
   
    let topic, units;

    try {
        topic = await Topic.findById(topicId)

    } catch (err) {
        const error = new HttpError('Fetching units failed..', 500);
        return next(error);

    }

 

    if (!topic) {
        const error = new HttpError('Could not find a topic', 404);
        return next(error);
    }

    try {
        units = await Unit.find({ topicId: topicId });


    } catch (err) {

        const error = new HttpError('Fetching units failed..', 500);
        return next(error);

    }

    if (!units) {
        const error = new HttpError('Could not find units', 404);
        return next(error);
    }

    res.json({
        units: units.map(unit => unit.toObject({ getters: true }))


    })


}


//2. get units by topicId

const getUnitsByTopicId = async (req, res, next) => {

    const topicId = req.params.topicId;
   
    let topic, units;

    try {
        topic = await Topic.findById(topicId)

    } catch (err) {
        const error = new HttpError('Fetching units failed..', 500);
        return next(error);

    }

 

    if (!topic) {
        const error = new HttpError('Could not find a topic', 404);
        return next(error);
    }

    try {
        units = await Unit.find({ topicId: topicId });


    } catch (err) {

        const error = new HttpError('Fetching units failed..', 500);
        return next(error);

    }

    if (!units) {
        const error = new HttpError('Could not find units', 404);
        return next(error);
    }

    res.json({
        units: units.map(unit => unit.toObject({ getters: true }))


    })


}


//3.Edit unit by unitId

const updateUnitByUnitId = async (req, res, next) => {
    const errroOnValidation = validationResult(req);
    let updateUnit, topic, subject;

    if (!errroOnValidation.isEmpty()) {
        const validationError = new HttpError('Invalid inputs', 422);
        return next(validationError);


    }

    const { name, description, updateItemId } = req.body;

    const unitId = updateItemId;

    try {
        updateUnit = await Unit.findById(unitId);
        topic = await Topic.findOne({ _id: updateUnit.topicId });
        subject = await Subject.findOne({  topicIds:  updateUnit.topicId  });

    } catch (err) {
        const error = new HttpError('Update unit failed..', 500);
        return next(error);

    }


    if (!updateUnit || !topic || !subject) {
        const error = new HttpError('Could not find ', 404);
        return next(error);

    }

    //check subject creator to authenticate user



    if (subject.creator.toString() !== req.userData.userId || !req.userData.isAdmin) {
        const error = new HttpError('Not allowed to update unit', 404);
        return next(error);

    }

    let unitName,unitDes;
    unitName = name.toLowerCase().split(' ').map(x => x[0].toUpperCase() + x.slice(1)).join(' ');
    unitDes= description.charAt(0).toUpperCase() + description.slice(1);

    updateUnit.name = unitName;
    updateUnit.description = unitDes;

    try {
        await updateUnit.save();

    } catch (err) {
        const error = new HttpError('Update unit failed', 500);
        return next(error);

    }

    res.json({ message: 'Update Completed' })


}

//4. Delete unit by unitId

const deleteUnitByUnitId = async (req, res, next) => {

    const unitId = req.body.deleteItemId;

    let deleteUnit, topic, subject;

    try {
        deleteUnit = await Unit.findById(unitId);
        topic = await Topic.findOne({ _id: deleteUnit.topicId });
        subject = await Subject.findOne({topicIds: deleteUnit.topicId});

    } catch (err) {
        const error = new HttpError('Delete unit failed', 500);
        return next(error);

    }

    if (!deleteUnit || !topic || !subject) {
        const error = new HttpError('Could not find', 404);
        return next(error);

    }

    //check subject creator to authenticate user

    if (subject.creator.toString() !== req.userData.userId || !req.userData.isAdmin) {
        const error = new HttpError('Not allowed to delete unit', 404);
        return next(error);

    }

    //  unit , quesAns delete


    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await QuesAns.deleteMany({ unitId: deleteUnit.id, session: sess });
        await deleteUnit.deleteOne({ session: sess });
        await sess.commitTransaction();

    } catch (err) {
        const error = new HttpError('Could not delete unit', 500);
        return next(error);

    }
    res.json({
        message: "Unit Deleted.."
    })


}


module.exports = {
    fetchUnitsByTopicId,
    getUnitsByTopicId,
    createUnitByTopictId,
    updateUnitByUnitId,
    deleteUnitByUnitId
}



