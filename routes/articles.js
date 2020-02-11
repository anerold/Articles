const express = require('express');
var router = express.Router();

let Articles = require('../models/articles');//import model
let Tags = require('../models/tags');


//otazky:
//1. ma mit article i nejakej text?

const Codes = {
    ok: 200,
    created: 201,
    notFound: 404,
    alreadyExists: 409,
    internalErr: 500
};

const Messages = {
    ok: "OK",
    created: "Article created",
    notFound: "Not Found",
    alreadyExists: "Article with this title already exists",
    internalErr: "Internal Server Error"
};




router.get('/', function (req, res) {
    res.send('Hello World!');
});





// create:
router.post('/articles', function (req, res) {
    //create article

    var data;

    articleExists(req.body.title, function (articleExists) {

        if (articleExists) {//article already exists in DB, cannot create a new one with same name
            res.status(Codes.alreadyExists).send(JSON.stringify({message: Messages.alreadyExists}));
        } else {
            const title = req.body.title;
            const description = req.body.description;
            const publishDate = req.body.publishDate;
            const authorName = req.body.authorName;


            data = new Articles({
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
            var index = 0;
            iterateTags(index, saveArticle);
        }



    });


    function saveArticle() {
        data.save((err, article) => {
            if (err) {
                console.log(err);
            } else {
                console.log('Saved in DB');
                associateArticlesWithTags(article._id, data.tags, function (err) {
                    if (err) {
                        res.status(Codes.internalErr).send(JSON.stringify({message: Messages.internalErr}));
                    } else {
                        res.status(Codes.created).send(JSON.stringify({message: Messages.ok})); //201: Created
                    }
                });

            }
        });

    }


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
    Articles.findOne({title: req.params.title}, {_id: 0, __v: 0}, function (err, docs) { //return article with ommited _id and __v
        if (err) {
            res.status(Codes.internalErr).send(JSON.stringify({message: Messages.internalErr}));
        } else {
            if (docs) {
                //find this article's tags by ids:
                Tags.find({
                    '_id': {$in: docs.tags}
                }, function (err, tags) {
                    if (err) {
                        res.status(Codes.internalErr).send(JSON.stringify({message: Messages.internalErr}));
                    } else {

                        for (var i = 0; i < tags.length; i++) {
                            docs.tags[i] = tags[i].name; //rewrite ids of tags in array with actual names of the tags 
                        }
                        res.status(Codes.ok).send(docs);
                    }
                });

            } else {
                res.status(Codes.notFound).send(JSON.stringify({message: Messages.notFound}));
            }
        }
    });
});

//list:
router.get('/articles', function (req, res) {
    //list articles
    Articles.find({}, {}, function (err, result) {

        if (err) {
            res.status(Codes.internalErr).send(JSON.stringify({message: Messages.internalErr}));
        } else {
            var response = [];
            for (var i = 0; i < result.length; i++) {
                response.push(result[i].title); //return only array of article titles
            }
            res.status(Codes.ok).send(response);
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

function articleExists(articleTitle, callback) {
    Articles.findOne({title: articleTitle}, function (err, docs) {
        if (err) {

        } else {
            if (docs) {
                return callback(true);
            } else {
                return callback(false);
            }

        }
    });


}


module.exports = router;