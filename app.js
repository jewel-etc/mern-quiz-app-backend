const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({
    extended: false
}));

const mongoose = require('mongoose');

const HttpError = require('./models/http-error.js');


const usersRoutes = require('./routes/users-routes.js');

const subjectsRoutes = require('./routes/subjects-routes.js');

const topicsRoutes = require('./routes/topics-routes.js');

const unitsRoutes = require('./routes/units-routes.js');

const quesAnsRoutes = require('./routes/quesAns-routes.js');



app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
  
    next();
  });

app.use('/api/users', usersRoutes)
app.use('/api/subjects', subjectsRoutes);
app.use('/api/topics', topicsRoutes);
app.use('/api/units', unitsRoutes);
app.use('/api/quesAns', quesAnsRoutes)



//unsupported routes
app.use((req, res, next) => {

    const error = new HttpError('Could not find this route', 404);
    return next(error);

})


//eror handling
app.use((error, req, res, next) => {


    if (res.headerSent) {
        return next(error);
    }


    res.status(error.code || 500);
    res.json({
        message: error.message || 'An unknown error occured'
    });

})

mongoose
    .connect('mongodb+srv://satadru:Satadru1234@cluster0.zze4e.mongodb.net/MERN-QUIZ?retryWrites=true&w=majority')
    .then(() => {
        console.log("Connect to Database")
        app.listen(process.env.PORT || 5000);

    })
    .catch((err => {
        console.log(err);
    }))


