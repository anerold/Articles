const express = require('express');
var router = express.Router();

let Articles = require('../models/articles');//import model
let Tags = require('../models/tags');

router.get('/', function (req, res) {
    Tags.find({}, {_id: 0, __v: 0}, function (err, docs) {
        console.log(docs);
        if (err) {
            res.status(500).send('Internal Server Error.');
        } else {

            Articles.find({
                '_id': {$in: docs.articles}
            }, function (err, articles) {
                if (err) {
                    res.status(500).send(JSON.stringify({message: "Internal server error"}));
                } else {
                    console.log(articles);
                    for (var i = 0; i < articles.length; i++) {
                        docs.articles[i] = articles[i].title; //rewrite ids of tags in array with actual names of the tags 
                    }
                    res.status(200).send(docs);
                }
            });




        }
    });
});




module.exports = router;