const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const {Codes, Messages} = require('./respCodes');

const port = 3000;

if (process.argv[2]) {
    mongoose.connect(process.argv[2]);
} else {
    mongoose.connect('mongodb://localhost:27017/articles');//connect to DB
}

let db = mongoose.connection;
db.on('error', function (err) {//if connection error 
    console.log(err);
});
db.once('open', function () {//if connection is ok
    console.log('connected to mongoDB');
});


app.use(bodyParser.json()); // support json encoded bodies

app.listen(port, function () {
    console.log("Server listening on port " + port);
});

app.use(function (error, req, res, next) {
    //Catch json error
    res.status(Codes.badRequest).send(JSON.stringify({message: Messages.badRequest, reason: "Input is not a valid JSON"}));
});


app.use(function(req, res, next) {
  //invalid endpoint call
  res.status(Codes.notFound).send(JSON.stringify({message: Messages.notFound, reason: "Invalid endpoint"}));

});


let articles = require('./routes/articles');
app.use('/api/articles', articles);

let tags = require('./routes/tags');
app.use('/api/tags', tags);

