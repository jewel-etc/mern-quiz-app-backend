const express = require('express');
const { check } = require('express-validator');
const checkAuth=require('../middleware/check-auth.js');


const router = express.Router();

const usersController = require('../controllers/users-controllers.js');



//1.Sign up
router.post('/signup',
    [
        check('name')
            .not()
            .isEmpty(),

        check('username')
            .isLength({ min: 6 }),

        check('password')
            .isLength({ min: 6 }),

        check('adminPassword')
            .optional().
            isLength({ min: 8 })


    ], usersController.signup);

//2.Log in
 router.post('/login', usersController.login);

 //3..getFavByFavIds
router.post('/getFavSubjectsByFavIds/', usersController.getFavSubjectsByFavIds);


router.use(checkAuth);


//**************** AFTER AUTH*********************


//3.5 getUserByUserId
router.post('/getUserByUserId', usersController.getUserByUserId);

//4.addFavByUserId
router.post('/addFavSubjectsByUserId', usersController.addFavSubjectsByUserId);

//5.getFavByUserId
router.post('/getFavSubjectsByUserId', usersController.getFavSubjectsByUserId);

// //6.deleteFavByFavId
router.delete('/deleteFavSubjectByFavSubjectId', usersController.deleteFavSubjectByFavSubjectId);



//7.addSaveByUserId
router.post('/addSaveSubjectsByUserId', usersController.addSaveSubjectsyUserId);

//8.getSaveByUserId
router.post('/getSaveSubjectsByUserId/', usersController.getSaveSubjectsByUserId)

//9.deleteSaveBySaveId
router.delete('/deleteSaveSubjectBySaveSubjectId', usersController.deleteSaveSubjectBySaveSubjectId);

//10.updateProfileByUserId
router.patch('/updateProfileByUserId', usersController.updateProfileByUserId);


//11.changePasswordByUserId
router.patch('/changePasswordByUserId', usersController.changePasswordByUserId);


module.exports = router;
