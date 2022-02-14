const express = require('express');

const router = express.Router();

const { check } = require('express-validator');

const checkAuth = require('../middleware/check-auth.js');

const quesAnsControllers = require('../controllers/quesAns-controllers.js');







router.use(checkAuth);

//                  *************************AFTER AUTH***************************************************


router.post('/getQuesAnsByUnitId/:unitId', quesAnsControllers.getQuesAnsByUnitId);


//create a new ques  by unit Id

router.post('/createQuesAnsByUnitId',
    [
        check('description')
            .isLength({ max: 500 }),

        check('question')
            .not()
            .isEmpty(),
        check('option1')
            .not()
            .isEmpty(),
        check('option2')
            .not()
            .isEmpty(),
        check('option3')
            .not()
            .isEmpty(),
        check('option4')
            .not()
            .isEmpty(),

        check('correctOption')
            .not()
            .isEmpty(),

        check('explanation')
            .isLength({ max: 500 })



    ], quesAnsControllers.createQuesAnsByUnitId);

//Edit question_answer by quesAnsId

router.patch('/updateQuesAnsByQuesAnsId/',
    [
        check('description')
            .isLength({ max: 500 }),

        check('question')
            .not()
            .isEmpty(),
        check('option1')
            .not()
            .isEmpty(),
        check('option2')
            .not()
            .isEmpty(),
        check('option3')
            .not()
            .isEmpty(),
        check('option4')
            .not()
            .isEmpty(),

        check('correctOption')
            .not()
            .isEmpty(),

        check('explanation')
            .isLength({ max: 500 })

    ], quesAnsControllers.updateQuesAnsByQuesAnsId);

//Delete question_answer by quesAnsId

router.delete('/deleteQuesAnsByQuesAnsId/', quesAnsControllers.deleteQuesAnsByQuesAnsId);

module.exports = router;
