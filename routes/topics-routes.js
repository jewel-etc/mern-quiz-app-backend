const express = require('express');

const router = express.Router();

const { check } = require('express-validator');

const checkAuth=require('../middleware/check-auth.js');

const topicsControllers = require('../controllers/topics-controllers.js');
// //get all topics by subject id
router.post('/getTopicsAndUnitsBySubjectId/:subjectId', topicsControllers.getTopicsAndUnitsBySubjectId);




router.use(checkAuth);



//                  *************************AFTER AUTH***************************************************

// //get all topics by subject id
// router.post('/getTopicsAndUnitsBySubjectId/', topicsControllers.getTopicsAndUnitsBySubjectId);




//create a new topic by subject Id

router.post('/createTopicBySubjectId',
    [
        check('name')
            .not()
            .isEmpty(),

     

    ], topicsControllers.createTopicBySubjectId)


//Edit topic by subjectId

router.patch('/updateTopicByTopicId/',
    [
        check('name')
            .not()
            .isEmpty(),

       

    ], topicsControllers.updateTopicByTopicId);


//delete topic by topicId

router.delete('/deleteTopicByTopicId/', topicsControllers.deleteTopicByTopicId);




module.exports = router;




