const HttpError = require('../models/http-error.js');

const { validationResult } = require('express-validator');

const bcrypt = require('bcryptjs');

const jwt = require('jsonwebtoken');

const mongoose = require('mongoose');

const User = require('../models/user-schema.js');

const Subject = require('../models/subject-schema.js');


//1.sign up

const signup = async (req, res, next) => {

    const errroOnValidation = validationResult(req);

    if (!errroOnValidation.isEmpty()) {
        const validationError = new HttpError('Invalid inputs', 422);
        return next(validationError);


    }

    const { favSave, name, username, password, adminPassword, newFavSubjectsIds, newSaveSubjectsIds } = req.body;


    let existingUser, favSubjectsIds, saveSubjectsIds, favSubjects, saveSubjects;



    //CHECK FAV AND SAVE IDS ARE PRESENT IN SUBJECT SCHEMA
    try {
        favSubjects = await Subject.find({ _id: newFavSubjectsIds });
        saveSubjects = await Subject.find({ _id: newSaveSubjectsIds });

    } catch (err) {
        const error = new HttpError('Signup  failed', 500);
        return next(error);

    }




    if (!favSubjects || !saveSubjects) {
        const error = new HttpError('Signup  failed', 400);
        return next(error);

    }

    //find same user

    try {
        existingUser = await User.findOne({ username: username });

    } catch (err) {
        const error = new HttpError('Signup failed', 500);
        return next(error);

    }
    if (existingUser) {
        const error = new HttpError('User already exist', 422);
        return next(error);

    }

    if (favSave === 'fav') {
        saveSubjectsIds = [];

        favSubjectsIds = [...new Set(newFavSubjectsIds)];


    }

    else if (favSave === 'save') {

      

        let saveSub = newSaveSubjectsIds.filter(save => !newFavSubjectsIds.includes(save))

        let favSub = newFavSubjectsIds.filter(fav => !newSaveSubjectsIds.includes(fav))
     
        favSubjectsIds = [...new Set(favSub)];
        saveSubjectsIds = [...new Set(saveSub)];


    }

    

    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(password, 12);


    } catch (err) {
        const error = new HttpError('Could not create user', 500);
        return next(error);

    }
    // (hashedPassword)   


    let hashedAdminPassword = null;
    if (adminPassword) {
        try {
            hashedAdminPassword = await bcrypt.hash(adminPassword, 12);

        } catch (err) {
            const error = new HttpError('Could not admin', 500);
            return next(error);

        }

    }

    let isAdmin = false;
    if (hashedAdminPassword !== null) {
        isAdmin = true;
    }

    
    let capitalizeName=name.toLowerCase().replace(/(^| )(\w)/g, s => s.toUpperCase())

    const createdUser = new User({
       
        name:capitalizeName,
        username,
        password: hashedPassword,
        adminPassword: hashedAdminPassword,
        favSubjectsIds,
        saveSubjectsIds
    })

    // (createdUser)


    let token;

    try {
        token = jwt.sign(
            {
                userId: createdUser.id,
                isAdmin: isAdmin
            },
            'supersecretkey',
            { expiresIn: '24h' }
        )

    } catch (err) {

        const error = new HttpError('Signup failed.......................', 500);
        return next(error);

    }




    try {
        await createdUser.save();

    } catch (err) {
        const error = new HttpError('Signup failed.......................', 500);
        return next(error);

    }



    res.json({
        userId: createdUser.id,
        name: createdUser.name,
        username: createdUser.username,
        token: token,
        isAdmin,
        favSubjectsIds: createdUser.favSubjectsIds,
        saveSubjectsIds: createdUser.saveSubjectsIds

    })


}

//2.login

const login = async (req, res, next) => {
    const { favSave, username, password, adminPassword, newFavSubjectsIds, newSaveSubjectsIds } = req.body;


    


    let favSubIds, saveSubIds, favSubjects, saveSubjects;


    try {
        favSubjects = await Subject.find({ _id: newFavSubjectsIds });
        saveSubjects = await Subject.find({ _id: newSaveSubjectsIds });

    } catch (err) {
        const error = new HttpError('Signin  failed', 500);
        return next(error);

    }

    if (!favSubjects || !saveSubjects) {
        const error = new HttpError('Signin  failed', 400);
        return next(error);

    }

    //find user
    let existingUser;

    try {

        existingUser = await User.findOne({ username: username });

    } catch (err) {
        const error = new HttpError('Signin failed', 500);
        return next(error);

    }

    if (!existingUser) {
        const error = new HttpError('Invalid credentials', 401);
        return next(error);
    }

    let isValidPassword = false;
    try {
        isValidPassword = await bcrypt.compare(password, existingUser.password);

    } catch (err) {
        const error = new HttpError('Could not log in', 500);
        return next(error);

    }

    if (!isValidPassword) {
        const error = new HttpError('Invalid credentials', 401);
        return next(error);

    }

    let isValidAdminPassword = false, isAdmin = false;
    if (adminPassword) {

        try {
            isValidAdminPassword = await bcrypt.compare(adminPassword, existingUser.adminPassword);

        } catch (err) {
            const error = new HttpError('Could not log in as an admin', 500);
            return next(error);

        }

        if (!isValidAdminPassword) {
            const error = new HttpError('Invalid credentials for admin', 401);
            return next(error);

        } else {
            isAdmin = true;

        }

    }

    existingUser = updateFavSaveIds(favSave, existingUser, newFavSubjectsIds, newSaveSubjectsIds);

    let token;

    try {
        token = jwt.sign(
            {
                userId: existingUser.id,
                isAdmin: isAdmin
            },
            'supersecretkey',
            { expiresIn: '24h' }
        )

    } catch (err) {

        const error = new HttpError('Signin failed.......................', 500);
        return next(error);

    }

    try {

        await existingUser.save();

    } catch (err) {
        const error = new HttpError('Login failed...', 401);
        return next(error);

    }

    res.json({
        userId: existingUser.id,
        name: existingUser.name,
        username: existingUser.username,
        token: token,
        isAdmin,
        favSubjectsIds: existingUser.favSubjectsIds,
        saveSubjectsIds: existingUser.saveSubjectsIds

    })


}

//3.getFavByFavIds
const getFavSubjectsByFavIds = async (req, res, next) => {

    let favIds = req.body.favIds
    let favSubjects;

    try {
        favSubjects = await Subject.find({ _id: favIds })

    } catch (err) {
        const error = new HttpError('Fetching fav subjects failed..', 500);
        return next(error);

    }
 

    res.json({ favSubjects: favSubjects.map(fav => fav.toObject({ getters: true })) });


}

//3.5 getUserByUserId

const getUserByUserId= async (req, res, next) => {

    let userId = req.userData.userId
    let user;

    try {
        user = await User.findById(userId).select(['-password' ,'-adminPassword'])

    } catch (err) {
        const error = new HttpError('Something went wrong..', 500);
        return next(error);

    }
    if (!user) {
        const error = new HttpError('Fetching fav subjects failed..', 400);
        return next(error);

    }


    res.json({ user });


}



//4.addFavByUserId

const addFavSubjectsByUserId = async (req, res, next) => {

    const { newFavSubjectsIds, userId } = req.body;
    let favSubjects;

    try {
        favSubjects = await Subject.find({ _id: newFavSubjectsIds });

    } catch (err) {
        const error = new HttpError('Add fav   failed', 500);
        return next(error);

    }

    if (!favSubjects) {
        const error = new HttpError('Add fav  failed', 400);
        return next(error);

    }


    //find user
    let existingUser;

    try {

        existingUser = await User.findById(userId);

    } catch (err) {
        const error = new HttpError('Add fav subjects failed', 500);
        return next(error);

    }

    if (!existingUser) {
        const error = new HttpError('User not found', 401);
        return next(error);
    }

    existingUser = updateFavSaveIds('fav', existingUser, newFavSubjectsIds, []);

    if (userId !== req.userData.userId) {
        const error = new HttpError('Not allowed to save fav subjects', 404);
        return next(error);

    }

    try {

        await existingUser.save();

    } catch (err) {
        const error = new HttpError('Add fav subjects failed', 500);
        return next(error);

    }

    res.json({
        existingUser
    })

}

//5.getFavByUserId
const getFavSubjectsByUserId = async (req, res, next) => {


    const userId = req.body.userId;
 
    let favSubjects, user;

    try {
        user = await User.findById(userId);

    } catch (err) {
        const error = new HttpError('Fetching fav couses failed..', 500);
        return next(error);

    }

    if (!user) {
        const error = new HttpError('Could not find a user', 404);
        return next(error);

    }

    try {
        favSubjects = await Subject.find({ _id: user.favSubjectsIds })

    } catch (err) {
        const error = new HttpError('Fetching fav subjects failed..', 500);
        return next(error);

    }

    if (!favSubjects) {
        const error = new HttpError('Could not find fav subjects', 404);
        return next(error);

    }  

    if (userId !== req.userData.userId) {
        const error = new HttpError('Not allowed to fetch subjects', 404);
        return next(error);

    }

    res.json({ favSubjects: favSubjects.map(fav => fav.toObject({ getters: true })) });



};


//6.deleteFavByFavId

const deleteFavSubjectByFavSubjectId = async (req, res, next) => {

    const deleteFavSubjectId = req.body.deleteFavSubId;
    const userId = req.userData.userId;

    let deleteFavSubject, user;
    try {
        deleteFavSubject = await Subject.findById(deleteFavSubjectId);

    } catch (err) {
        const error = new HttpError('Delete fav subject failed..', 500);
        return next(error);


    }
    if (!deleteFavSubject) {
        const error = new HttpError('Could not find fav subject', 400);
        return next(error);

    }

    //find user

    try {
        user = await User.findById(userId)

    } catch (err) {

        const error = new HttpError('Delete fav subject failed..', 500);
        return next(error);

    }



    if (!user) {
        const error = new HttpError('Could not find the user', 400);
        return next(error);

    }

    //check userId to authenticate user

    if (user.id !== req.userData.userId) {
        const error = new HttpError('Not allowed to delete fav subject', 404);
        return next(error);

    }

    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await user.favSubjectsIds.pull(deleteFavSubjectId);
        await user.save();
        await sess.commitTransaction();

    } catch (err) {
        const error = new HttpError('Could not delete fav subject...', 500);
        return next(error);

    }

    res.json({
        favIds: user.favSubjectsIds

    })



}




//7.addSaveByUserId

const addSaveSubjectsyUserId = async (req, res, next) => {
    const { newSaveSubjectsIds, newFavSubjectsIds } = req.body;

    const userId = req.userData.userId

    let favSubjects, saveSubjects;

    try {
        favSubjects = await Subject.find({ _id: newFavSubjectsIds });
        saveSubjects = await Subject.find({ _id: newSaveSubjectsIds });

    } catch (err) {
        const error = new HttpError(' Save subjects  failed', 500);
        return next(error);

    }

    if (!favSubjects || !saveSubjects) {
        const error = new HttpError('Subjects not found', 400);
        return next(error);

    }
    //find user

    let existingUser;

    try {

        existingUser = await User.findById(userId);

    } catch (err) {
        const error = new HttpError('Add save subjects failed', 500);
        return next(error);

    }

    if (!existingUser) {
        const error = new HttpError('User not found', 401);
        return next(error);
    }


    existingUser = updateFavSaveIds('save', existingUser, newFavSubjectsIds, newSaveSubjectsIds);

    try {

        await existingUser.save();

    } catch (err) {
        const error = new HttpError('Add Save subjects failed', 500);
        return next(error);

    }

    (existingUser)

    res.json({
        favSubjectsIds: existingUser.favSubjectsIds,
        saveSubjectsIds: existingUser.saveSubjectsIds
    })

}


//8.getSaveByUserId

const getSaveSubjectsByUserId = async (req, res, next) => {


    const userId = req.userData.userId;
    let saveSubjects, user;

    try {
        user = await User.findById(userId);

    } catch (err) {

        const error = new HttpError('Fetching save couses failed..', 500);
        return next(error);

    }



    if (!user) {
        const error = new HttpError('Could not find a user', 404);
        return next(error);

    }

    try {
        saveSubjects = await Subject.find({ _id: user.saveSubjectsIds })

    } catch (err) {
        const error = new HttpError('Fetching fav subjects failed..', 500);
        return next(error);

    }

    if (!saveSubjects) {
        const error = new HttpError('Could not find fav subjects', 404);
        return next(error);

    }
    res.json({
        saveSubjects: saveSubjects.map(saveSub => saveSub.toObject({ getters: true }))
    })


};

//9.deleteSaveBySaveId

const deleteSaveSubjectBySaveSubjectId = async (req, res, next) => {
    const deleteSaveSubjectId = req.body.deleteSaveSubId;
    const userId = req.userData.userId;



    let deleteSaveSubject, user;
    try {
        deleteSaveSubject = await Subject.findById(deleteSaveSubjectId);

    } catch (err) {
        const error = new HttpError('Delete save subject failed..', 500);
        return next(error);


    }
    if (!deleteSaveSubject) {
        const error = new HttpError('Could not find save subject', 400);
        return next(error);

    }

    //find user

    try {
        user = await User.findById(userId)

    } catch (err) {

        const error = new HttpError('Delete save subject failed..', 500);
        return next(error);

    }

    if (!user) {
        const error = new HttpError('Could not find the user', 400);
        return next(error);

    }

    //check userId to authenticate user

    if (user.id !== req.userData.userId) {
        const error = new HttpError('Not allowed to delete save subject', 404);
        return next(error);

    }


    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await user.saveSubjectsIds.pull(deleteSaveSubjectId);
        await user.save();
        await sess.commitTransaction();

    } catch (err) {
        const error = new HttpError('Could not delete save subject...', 500);
        return next(error);

    }



    res.json({
        saveIds: user.saveSubjectsIds

    })



}

//10.updateProfileByUserId

const updateProfileByUserId = async (req, res, next) => {
    const { name, username, password } = req.body;
    const userId = req.userData.userId;
    let existingUser;

    try {
        existingUser = await User.findById(userId);

    } catch (err) {
        const error = new HttpError('Update failed', 500);
        return next(error);

    }

    if (!existingUser) {
        const error = new HttpError('User not found', 422);
        return next(error);

    }

    let isValidPassword = false;
    try {
        isValidPassword = await bcrypt.compare(password, existingUser.password);

    } catch (err) {
        const error = new HttpError('Update failed', 500);
        return next(error);

    }

    if (!isValidPassword) {
        const error = new HttpError('Invalid password', 401);
        return next(error);

    }

    let capitalizeName=name.toLowerCase().replace(/(^| )(\w)/g, s => s.toUpperCase())

    existingUser.name = capitalizeName;
    existingUser.username = username;

    try {
        await existingUser.save();

    } catch (err) {
        const error = new HttpError('Update profile failed', 500);
        return next(error);

    }

    res.json({
        existingUser,
        message: 'Your change successfully saved'
    })

}

//11.changePasswordByUserId

const changePasswordByUserId = async (req, res, next) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const userId = req.userData.userId;
    let existingUser;

    try {
        existingUser = await User.findById(userId);

    } catch (err) {
        const error = new HttpError('Change Password failed', 500);
        return next(error);

    }

    if (!existingUser) {
        const error = new HttpError('User not found', 422);
        return next(error);

    }


    let isValidPassword = false;
    try {
        isValidPassword = await bcrypt.compare(oldPassword, existingUser.password);

    } catch (err) {
        const error = new HttpError('Change password failed', 500);
        return next(error);

    }

    if (!isValidPassword) {
        const error = new HttpError('Invalid password', 401);
        return next(error);

    }
    if (oldPassword === newPassword) {

        const error = new HttpError('Old & new password must not be same', 401);
        return next(error);

    }

    if (newPassword !== confirmPassword) {

        const error = new HttpError('New & confirm password must  be same', 401);
        return next(error);

    }

    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(newPassword, 12);


    } catch (err) {
        const error = new HttpError('Could not change password', 500);
        return next(error);

    }

    existingUser.password = hashedPassword;


    try {
        await existingUser.save();

    } catch (err) {
        const error = new HttpError('Change password failed', 500);
        return next(error);

    }

    res.json({

        message: 'Password changed successfully'
    })

}




const updateFavSaveIds = (favSave, existingUser, newFavSubjectsIds, newSaveSubjectsIds) => {

    (existingUser)


    let existingUserStringSaveSubIds = [], existingUserStringFavSubIds = [];
    if (favSave === 'save') {


        for (let i = 0; i < existingUser.favSubjectsIds.length; i++) {
            existingUserStringFavSubIds[i] = existingUser.favSubjectsIds[i].toString();
        }

        let favIds = [...new Set([...newFavSubjectsIds, ...existingUserStringFavSubIds])]
        let favSubIds = favIds.filter((fav) => !newSaveSubjectsIds.includes(fav.toString()));
       
        existingUser.favSubjectsIds = favSubIds

        for (let i = 0; i < existingUser.saveSubjectsIds.length; i++) {
            existingUserStringSaveSubIds[i] = existingUser.saveSubjectsIds[i].toString();
        }

        let saveSubIds = [...new Set([...newSaveSubjectsIds, ...existingUserStringSaveSubIds])]

        existingUser.saveSubjectsIds = saveSubIds;

    }

    else if (favSave === 'fav') {

        for (let i = 0; i < existingUser.favSubjectsIds.length; i++) {
            existingUserStringFavSubIds[i] = existingUser.favSubjectsIds[i].toString();
        }

        let favSubIds = [...new Set([...newFavSubjectsIds, ...existingUserStringFavSubIds])]

        for (let i = 0; i < existingUser.saveSubjectsIds.length; i++) {
            existingUserStringSaveSubIds[i] = existingUser.saveSubjectsIds[i].toString();
        }


        favSubIds = favSubIds.filter(fav => !existingUserStringSaveSubIds.includes(fav));

      

        (favSubIds)

        existingUser.favSubjectsIds = favSubIds;



    } else {

    }

   

    return (existingUser);
}




module.exports = {

    signup,
    login,
    getFavSubjectsByFavIds,
    getUserByUserId,
    addFavSubjectsByUserId,
    getFavSubjectsByUserId,
    addSaveSubjectsyUserId,
    getSaveSubjectsByUserId,
    deleteFavSubjectByFavSubjectId,
    deleteSaveSubjectBySaveSubjectId,
    updateProfileByUserId,
    changePasswordByUserId
};
