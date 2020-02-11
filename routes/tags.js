const express = require('express');
var router = express.Router();

let Articles = require('../models/articles');//import model
let Tags = require('../models/tags');

router.get('/', function (req, res) {
    Tags.find({}, { _id: 0, __v: 0 }, function (err, docs) {
        if (err) {
            res.status(500).send('Internal Server Error.');
        } else {
            var allArticleIDs = [];
            for (var i = 0; i < docs.length; i++) {
                for(var j = 0; j<docs[i].articles.length;j++){
                    if(!(allArticleIDs.indexOf(String(docs[i].articles[j])) > -1)){ //if not already in array, push it
                        allArticleIDs.push(String(docs[i].articles[j]));
                    }
                }
                
            }

            Articles.find({
                '_id': { $in: allArticleIDs }
            }, function (err, articles) {
                console.log(articles);
                console.log("///////////////////////////////////")
                console.log(docs);
                if (err) {
                    res.status(500).send(JSON.stringify({ message: "Internal server error" }));
                } else {
                    for (var i = 0; i < docs.length; i++) {
                        docs[i].articles[i] = articles[i].title; //rewrite ids of tags in array with actual names of the tags 
                    }
                    res.status(200).send(docs);
                }
            });




        }
    });
});




module.exports = router;