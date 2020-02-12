const express = require('express');
var router = express.Router();

let Articles = require('../models/articles');//import model
let Tags = require('../models/tags');

router.get('/', function (req, res) {
    //first create pairs {articleID1:articleTitle1, articleID2: articleTitle2, ...}
    Articles.find({}, function (err, articles) {
        if (err) {
            res.status(500).send(JSON.stringify({message: "Internal server error"}));
        } else {
            articleTitles = {};
            for (var i = 0; i < articles.length; i++) {
                if (!articleTitles.hasOwnProperty(articles[i]._id)) {
                    articleTitles[articles[i]._id] = articles[i].title;
                }
            }
            //then list all tags, rewrite their article's ids with its names and send to client:
            Tags.find({}, {_id: 0, __v: 0}, function (err, tags) {  //ommit _id and __v
                if (err) {
                    res.status(500).send('Internal Server Error.');
                } else {

                    for (var i = 0; i < tags.length; i++) { // iterate trough all tags
                        for (var j = 0; j < tags[i].articles.length; j++) { //iterate trough tag's articles
                            tags[i].articles[j] = articleTitles[tags[i].articles[j]]; //change article's id to article's name (because we don't want to send the client DB's IDs)
                        }
                    }
                    res.status(200).send(tags);

                }
            });

        }
    });


});




module.exports = router;