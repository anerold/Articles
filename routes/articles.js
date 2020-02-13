const express = require('express');
const {check, validationResult} = require('express-validator');
const {Codes, Messages} = require('../respCodes');
var router = express.Router();

let Articles = require('../models/articles');//import model
let Tags = require('../models/tags');


// create:
// params: title, description, authorName, publishDate, tags
router.post('/', [
    //validate inputs:
    check('title').isString(),
    check('description').isString(),
    check('authorName').isString(),
    check('publishDate').isString(),
    check('tags').isArray()
], function (req, res) {
    //create article

    var data;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(Codes.badRequest).send(JSON.stringify({message: Messages.badRequest, reason: errors}));
        return;
    }

    articleExists(req.body.title, function (articleExists) {

        if (articleExists) {//article already exists in DB, cannot create a new one with same name
            res.status(Codes.alreadyExists).send(JSON.stringify({message: Messages.alreadyExists}));
            return;
        }
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

        if (req.body.tags.length === 0) { //article have no tags
            saveArticle();
        } else {
            //check if tag already exists in collection Tags
            //if yes, associate its _id with this document
            //if not, create new tag and associate its _id with this document
            var index = 0;
            iterateTags(req.body.tags, data, index, saveArticle);
        }


    });


    function saveArticle() {
        data.save(function (err, article) {
            if (err) {
                res.status(Codes.internalErr).send(JSON.stringify({message: Messages.internalErr}));
            } else {
                associateArticlesWithTags(article._id, data.tags, function (err) {
                    if (err) {
                        res.status(Codes.internalErr).send(JSON.stringify({message: Messages.internalErr}));
                    } else {
                        res.status(Codes.created).send(JSON.stringify({message: Messages.created})); //201: Created
                    }
                });

            }
        });

    }

});

//  edit:
//  //params: title, description,authorName,publishDate,addTags,removeTags
router.put('/:title', [
    //validate inputs:
    check('title').optional().isString(),
    check('description').optional().isString(),
    check('authorName').optional().isString(),
    check('publishDate').optional().isString(),
    check('addTags').optional().isArray(),
    check('removeTags').optional().isArray()
], function (req, res) {
    //edit article
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        //there were some errors validating input
        res.status(Codes.badRequest).send(JSON.stringify({message: Messages.badRequest, reason: errors}));
        return;
    }

    var data = JSON.parse(JSON.stringify(req.body));  //make a deep copy of req.body

    delete data.addTags;
    delete data.removeTags;
    data.tags = [];
    var tagsToBeRemoved = [], tagsToBeAdded = [];
    var articleID;


    if (!(req.body.addTags || req.body.removeTags)) {  //there are no tags to be edited, jump straight to editing the article
        editArticle();
    } else {
        //first find the article to edit in order to read its current tags:
        Articles.findOne({title: req.params.title}, {}, function (err, docs) {
            if (err) {
                res.status(Codes.internalErr).send(JSON.stringify({message: Messages.internalErr}));
            } else {
                if (docs) {
                    articleID = docs._id;
                    //find this article's tags by ids:
                    Tags.find({
                        '_id': {$in: docs.tags}
                    }, function (err, tags) {
                        if (err) {
                            res.status(Codes.internalErr).send(JSON.stringify({message: Messages.internalErr}));
                        } else {
                            var existingTagNames = [];
                            for (var i = 0; i < tags.length; i++) {
                                existingTagNames.push(tags[i].name); //push names of the tags associated with this article
                            }
                            if (req.body.removeTags) {
                                tagsToBeRemoved = existingTagNames.filter(val => req.body.removeTags.includes(val));
                            }
                            if (req.body.addTags) {
                                tagsToBeAdded = req.body.addTags.filter(val => !existingTagNames.includes(val));  //remove any tags that are to be added but are already associated with the article
                            }
                            for (var i = 0; i < tagsToBeRemoved.length; i++) {
                                tagsToBeRemoved[i] = tags[existingTagNames.indexOf(tagsToBeRemoved[i])]._id; //convert array of names to array of ids
                            }

                            Tags.updateMany({_id: {$in: tagsToBeRemoved}}, {$pull: {"articles": docs._id}}, function (err, resp) { //pull this article's id from all tags associated with it
                                if (err) {
                                    res.status(Codes.internalErr).send(JSON.stringify({message: Messages.internalErr}));
                                } else {
                                    var index = 0;
                                    if (tagsToBeAdded.length !== 0) {
                                        iterateTags(tagsToBeAdded, data, index, editArticle);
                                    } else {
                                        editArticle();
                                    }

                                }
                            });


                        }
                    });

                } else {
                    res.status(Codes.notFound).send(JSON.stringify({message: Messages.notFound}));
                }
            }
        });
    }
    function editArticle() {
        const newTags = data.tags; //need to save new tags to new variable and delete from data othervise it will rewrite already existing tags with $set
        delete data.tags;



        Articles.updateOne(//no need to find the article here, I already know it exists from before
                {title: req.params.title},
                {
                    $set: data,
                    $pull: {tags: {$in: tagsToBeRemoved}},
                    //$push: {tags: {$each: newTags}},
                    $inc: {__v: 1},
                    $currentDate: {lastModified: true}
                },
                function (err) {

                    if (err) {
                        console.log(err);
                        res.status(Codes.internalErr).send(JSON.stringify({message: Messages.internalErr}));
                    } else {
                        Articles.updateOne(//updating tags needs to be done in two steps, first pull tags to be removed and second push tags to be added
                                {title: req.params.title},
                                {
                                    $push: {tags: {$each: newTags}}
                                },
                                function (err) {

                                    if (err) {
                                        console.log(err);
                                        res.status(Codes.internalErr).send(JSON.stringify({message: Messages.internalErr}));
                                    } else {

                                        associateArticlesWithTags(articleID, newTags, function (err) {
                                            if (err) {
                                                res.status(Codes.internalErr).send(JSON.stringify({message: Messages.internalErr}));
                                            } else {
                                                res.status(Codes.ok).send(JSON.stringify({message: Messages.ok}));
                                            }

                                        });


                                    }
                                });

                    }
                });
    }
});

// read:
router.get('/:title', function (req, res) {
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
router.get('/', function (req, res) {
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
router.delete('/:title', function (req, res) {
    //delete article
    Articles.findOneAndRemove({title: req.params.title}, function (err, deletedDoc) {

        if (err) {
            res.status(Codes.internalErr).send(JSON.stringify({message: Messages.internalErr}));
        } else {
            if (deletedDoc) {
                //find tags that have this article associated with it and remove this article's id from the tag's list so the tag is not associated with non-existing article
                Tags.find({articles: deletedDoc._id}, {}, function (err, tags) {  //find all tags that are associated with this article
                    if (err) {
                        res.status(Codes.internalErr).send(JSON.stringify({message: Messages.internalErr}));
                    } else {
                        tagsIDsArr = []; // created arr of tags ids that are associated with this article
                        for (var i = 0; i < tags.length; i++) {
                            tagsIDsArr.push(tags[i]._id);
                        }

                        Tags.updateMany({_id: {$in: tagsIDsArr}}, {$pull: {"articles": deletedDoc._id}}, function (err, resp) { //pull this article's id from all tags associated with it
                            if (err) {
                                res.status(Codes.internalErr).send(JSON.stringify({message: Messages.internalErr}));
                            } else {
                                res.status(Codes.ok).send(JSON.stringify({message: Messages.ok}));
                            }
                        });

                    }

                });

            } else {
                res.status(Codes.notFound).send(JSON.stringify({message: Messages.notFound}));

            }
        }
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

function iterateTags(tags, data, index, callback) {
    Tags.findOne({name: tags[index]}, function (err, result) {
        console.log(tags[index]);
        if (err) {
            console.log("error searching DB for tags")
        } else {
            if (result) { //tag already exists in DB. associate its _id with this article
                //push already existing's tag's id to this article's tags
                data.tags.push(result._id);
                if (index === tags.length - 1) {
                    callback();
                } else {
                    index++;
                    iterateTags(tags, data, index, callback);
                }
            } else { //tag does not exist, create it
                let newTag = new Tags({name: tags[index]});
                newTag.save().then(function (tag) {
                    //push new tag's id to this article's tags
                    data.tags.push(tag._id);
                    if (index === tags.length - 1) {
                        callback();
                    } else {
                        index++;
                        iterateTags(tags, data, index, callback);
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


module.exports = router;