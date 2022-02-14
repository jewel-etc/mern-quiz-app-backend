const express = require('express');

const { check } = require('express-validator');

const router = express.Router();

// const checkAuth=require('../middleware/check-auth.js');

const checkAuth = require('../middleware/check-auth');


const subjectsControllers = require('../controllers/subjects-controllers.js');


//get all subjects
router.get('/', subjectsControllers.getAllSubjects);



router.use(checkAuth); //check authentication


//                  *************************AFTER AUTH***************************************************


//get created subjects by userId
router.post('/getCreatedSubjectsByUserId/:userId', subjectsControllers.getCreatedSubjectsByUserId);

//create a new subject by user Id

router.post('/createSubjectByUserId',
    [
        check('name')
            .not()
            .isEmpty(),

    

    ], subjectsControllers.createSubjectByUserId);

//Edit subject by subjectId

router.patch('/updateSubjectBySubjectId/',
    [
        check('name')
            .not()
            .isEmpty(),

       

    ], subjectsControllers.updateSubjectBySubjectId);


//delete subject by subjectId

router.delete('/deleteSubjectBySubjectId/', subjectsControllers.deleteSubjectBySubjectId);

module.exports = router;
