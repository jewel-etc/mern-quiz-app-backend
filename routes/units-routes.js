const express = require('express');

const {check}=require('express-validator');

const router = express.Router();

const checkAuth=require('../middleware/check-auth.js');

const unitsController=require('../controllers/units-controllers.js');

router.get('/fetchUnitsByTopicId/:topicId',unitsController.getUnitsByTopicId);


router.use(checkAuth)



//                  *************************AFTER AUTH***************************************************

//get units by topicId

router.post('/getUnitsByTopicId/:topicId',unitsController.getUnitsByTopicId);

//create a new unit by topic Id

router.post('/createUnitByTopicId',
[
    check('name')
        .not()
        .isEmpty(),

  

],unitsController.createUnitByTopictId);

//Edit unit by unitId

router.patch('/updateUnitByUnitId/',
[
    check('name')
        .not()
        .isEmpty(),

  

],unitsController.updateUnitByUnitId);

//Delete unit by unitId

router.delete('/deleteUnitByUnitId/',unitsController.deleteUnitByUnitId)


module.exports = router;
