const HttpError = require('../models/http-error.js');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const User = require('../models/user-schema.js');
const Subject = require('../models/subject-schema.js');
const Topic = require('../models/topic-schema.js');
const Unit = require('../models/unit-schema.js');
const QuesAns = require('../models/quesAns-schema.js');




//1.Create subject by userId

const createSubjectByUserId = async (req, res, next) => {




    const errroOnValidation = validationResult(req)

    if (!errroOnValidation.isEmpty()) {
        const validationError = new HttpError('Invalid inputs', 422);
        return next(validationError);

    }

    const { name, description } = req.body;
    let user, subName, subDes;

    const userId = req.userData.userId;

    try {
        user = await User.findById(userId);

    } catch (err) {

        const error = new HttpError('Creating subject failed..', 500);
        return next(error);
    }


    if (!user) {
        const error = new HttpError('Could not find user', 404);
        return next(error);
    }

    subName = name.toLowerCase().split(' ').map(x => x[0].toUpperCase() + x.slice(1)).join(' ');
    subDes = description.charAt(0).toUpperCase() + description.slice(1);




    const createdSubject = new Subject({
        name: subName,
        description: subDes,
        creator: req.userData.userId
    })


    if (userId !== req.userData.userId || !req.userData.isAdmin) {
        const error = new HttpError('Not allowed to create subject', 404);
        return next(error);

    }

    try {
        await createdSubject.save()

    } catch (err) {
        const error = new HttpError('Creating subject failed', 500);
        return next(error);

    }

    let subjects;

    try {
        subjects = await Subject.find({})

    } catch (err) {
        const error = new HttpError('Fetching subjects failed', 500);
        return next(error);

    }



    res.json({ subjects: subjects.map(subject => subject.toObject({ getters: true })) })

}


//2.Get all subjects

const getAllSubjects = async (req, res, next) => {

    let subjects;

    try {
        subjects = await Subject.find({})

    } catch (err) {
        const error = new HttpError('Finding subjects failed', 500);
        return next(error);

    }

    if (!subjects) {
        const error = new HttpError('Could not find subjects', 404);
        return next(error);

    }
    res.json({ subjects: subjects.map(subject => subject.toObject({ getters: true })) });

}

//3. get subject by userId

const getCreatedSubjectsByUserId = async (req, res, next) => {


    const userId = req.params.userId;
    let subjects, user;
    try {
        user = await User.findById(userId);

    } catch (err) {

        const error = new HttpError('Fetching subjects failed..', 500);
        return next(error);
    }


    if (!user) {
        const error = new HttpError('Could not find user', 404);
        return next(error);
    }

    try {
        subjects = await Subject.find({ creator: userId })


    } catch (err) {
        const error = new HttpError('Finding subjects failed', 500);
        return next(error);

    }

    if (!subjects) {
        const error = new HttpError('Could not find subjects', 404);
        return next(error);

    }



    if (userId !== req.userData.userId && !req.userData.isAdmin) {
        const error = new HttpError('Not allowed to create subject', 404);
        return next(error);

    }


    res.json({
        subjects: subjects.map(subject => subject.toObject({ getters: true }))
    });

}



//4.Edit Subject by subject Id


const updateSubjectBySubjectId = async (req, res, next) => {

    const errroOnValidation = validationResult(req);
    let updateSubject;



    if (!errroOnValidation.isEmpty()) {
        const validationError = new HttpError('Invalid inputs', 422);
        return next(validationError);

    }

    const { name, description, updateItemId } = req.body;
    let subName, subDes;

    const subjectId = updateItemId;

    try {
        updateSubject = await Subject.findById(subjectId);

    } catch (err) {
        const error = new HttpError('Updating subject failed', 500);
        return next(error);

    }


    if (!updateSubject) {
        const error = new HttpError('Could not find subject', 404);
        return next(error);

    }

    subName = name.toLowerCase().split(' ').map(x => x[0].toUpperCase() + x.slice(1)).join(' ');
    subDes = description.charAt(0).toUpperCase() + description.slice(1);



    updateSubject.name = subName;
    updateSubject.description = subDes;

    //check subject creator to authenticate user

    if (updateSubject.creator.toString() !== req.userData.userId || !req.userData.isAdmin) {
        const error = new HttpError('Not allowed to update subject', 404);
        return next(error);

    }

    try {
        await updateSubject.save();

    } catch (err) {
        const error = new HttpError('Update subject failed', 500);
        return next(error);

    }

    res.json({ message: 'Update Completed' })



}


//5. Delete Subject subject Id

const deleteSubjectBySubjectId = async (req, res, next) => {


    const subjectId = req.body.deleteItemId;

    let deleteSubject, deleteTopics, deleteTopicsIds = [], deleteUnits, deleteUnitsIds = [];

    //find deleteSubject,deleteTopics,deleteUnits,deleteQuesAnswers

    try {
        deleteSubject = await Subject.findById(subjectId); //find subject to be deleted

        deleteTopics = await Topic.find({ _id: deleteSubject.topicIds });//find topics to be deleted

        //find deleteTopicsIds for delete units for this topics
        for (let i = 0; i < deleteTopics.length; i++) {
            deleteTopicsIds.push(deleteTopics[i].id);

        }


        deleteUnits = await Unit.find({ topicId: deleteTopicsIds })//find units to be deleted      

        //find deleteUnitsIds for delete quesAns for this units
        for (let i = 0; i < deleteUnits.length; i++)
            deleteUnitsIds.push(deleteUnits[i].id);


    } catch (err) {
        const error = new HttpError('Delete subject failed.....', 500);
        return next(error);

    }

    if (!deleteSubject) {
        const error = new HttpError('Could not find subject', 404);
        return next(error);

    }

    let userForFav, userForSave;
    try {
        userForFav = await User.find({ favSubjectsIds: subjectId })
        userForSave = await User.find({ saveSubjectsIds: subjectId })


    } catch (err) {
        const error = new HttpError('Dekete subject failed', 500);
        return next(error);

    }
    if (!userForFav || !userForSave) {
        const error = new HttpError('User not found', 404);
        return next(error);
    }

    if (userForFav) {
        userForFav.map(user => user.favSubjectsIds.pull(subjectId))
    }
    if (userForSave) {
        userForSave.map(user => user.saveSubjectsIds.pull(subjectId))

    }
    // try {

    //     await userForFav.map(user => user.save())

    // } catch (err) {
    //     const error = new HttpError('Del subject failed', 404);
    //     return next(error);

    // }



    //check subject creator to authenticate user

    if (deleteSubject.creator.toString() !== req.userData.userId || !req.userData.isAdmin) {
        const error = new HttpError('Not allowed to delete subject', 404);
        return next(error);

    }

    //subjet , topic, unit , delete delete  



    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await QuesAns.deleteMany({ unitId: deleteUnitsIds, session: sess });
        await Unit.deleteMany({ topicId: deleteTopicsIds, session: sess });
        await Topic.deleteMany({ _id: deleteSubject.topicIds, session: sess });
        await deleteSubject.deleteOne({ session: sess });
        await userForFav.map(user => user.save())
        await userForSave.map(user => user.save())
        await sess.commitTransaction();



    } catch (err) {
        const error = new HttpError('Could not delete subject', 500);
        return next(error);

    }
    res.json({
        message: "Delete Completed..."
    })

}

module.exports = {
    getAllSubjects,
    getCreatedSubjectsByUserId,
    createSubjectByUserId,
    updateSubjectBySubjectId,
    deleteSubjectBySubjectId

}