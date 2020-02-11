const express = require('express');
var router = express.Router();

let Articles = require('../models/articles');//import model
let Tags = require('../models/tags');


//otazky:
//1. ma mit article i nejakej text?



router.get('/', function (req, res) {
    res.send('Hello World!');
});



//list:
router.get('/articles', function (req, res) {
    //list articles
    Articles.find({}, {}, function (err, result) {

        if (err) {
            res.status(500).send('Internal Server Error.');
        } else {

            res.send(result);
        }
    });
});

// create:
router.post('/articles', function (req, res) {
    //create article

    const title = req.body.title;
    const description = req.body.description;
    const publishDate = req.body.publishDate;
    const authorName = req.body.authorName;


    let data = new Articles({
        title: title,
        description: description,
        publishDate: publishDate,
        authorName: authorName,
        createdAt: Date.now(),
        tags: []
    });


    //check if tag already exists in collection Tags
    //if yes, associate its _id with this document
    //if not, create new tag and associate its _id with this document

    function saveArticle() {
        data.save((err, article) => {
            if (err) {
                console.log(err);
            } else {
                console.log('Saved in DB');
                associateArticlesWithTags(article._id, data.tags, function (err) {  
                    if (err) {
                        res.status(500).send(JSON.stringify({message: "error"}));
                    } else {
                        res.status(200).send(JSON.stringify({message: "OK"}));
                    }
                });

            }
        });

    }

    var index = 0;
    iterateTags(index, saveArticle);
    //TODO: priradit knizky tagum
    function iterateTags(index, callback) {
        Tags.findOne({name: req.body.tags[index]}, function (err, result) {
            console.log(req.body.tags[index]);
            if (err) {
                console.log("error searching DB for tags");

            } else {
                if (result) { //tag already exists in DB. associate its _id with this article
                    //push already existing's tag's id to this article's tags
                    console.log("pushing existing tag: " + req.body.tags[index] + " with index " + index);
                    data.tags.push(result._id);
                    if (index === req.body.tags.length - 1) {
                        callback();
                    } else {
                        index++;
                        iterateTags(index, callback);
                    }

                } else { //tag does not exist, create it
                    let newTag = new Tags({name: req.body.tags[index]});
                    newTag.save().then(function (tag) {
                        //push new tag's id to this article's tags
                        console.log("pushing new tag: " + req.body.tags[index] + " with index " + index);
                        data.tags.push(tag._id);
                        if (index === req.body.tags.length - 1) {
                            callback();
                        } else {
                            index++;
                            iterateTags(index, callback);
                        }

                    }).catch(function (err) {
                        // some error occurred while saving newly created tag
                        throw new Error(err.message);
                    });
                    ;
                }
            }

        });


    }


});

//  edit:
router.put('/articles/:title', function (req, res) {
    //edit article

    Articles.updateOne(
            {title: req.params.title},
            {
                $set: req.body,
                $currentDate: {lastModified: true}
            }, function () {
        res.status(200).send('{}');
    }

    );
});

// read:
router.get('/articles/:title', function (req, res) {
    //read article
    Articles.find({title: req.params.title}, function (err, docs) { //TODO: predelat na findOne a nebo find ale cekovet esi to vrati prave jeden dokument (tj. nejsou duplikaty)
        if (err) {
            res.status(500).send('Internal Server Error.');
        } else {
            res.status(200).send(docs);
        }
    });
});

//    delete:
router.delete('/articles/:title', function (req, res) {
    //delete article
    Articles.deleteOne({title: req.params.title}, function () {
        res.status(200).send('{}');
    }
    );
});

function associateArticlesWithTags(articleID, tagsID, callback) {

    Tags.updateMany(
            {_id: {$in: tagsID}}, //array of tags ids to update
            {$push: {articles: articleID}},
            function (err) {
                callback(err);
            }
    );

}


module.exports = router;