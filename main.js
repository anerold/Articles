const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const port = 3000;

mongoose.connect('mongodb://localhost:27017/articles');//connect to DB

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



let articles = require('./routes/articles');
app.use('/api/articles', articles);

let tags = require('./routes/tags');
app.use('/api/tags', tags);

