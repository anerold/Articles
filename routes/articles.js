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
router.post('/articles/:title', function (req, res) {
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
    
    for (var i = 0; i < req.body.tags.length; i++) {
        
        let thisTag = req.body.tags[i];
        Tags.findOne({name: thisTag}, function (err, result) {
            
            if (err) {


            } else {
                if (result) { //tag already exists in DB. associate its _id with this article
                    console.log("ok, asi nalezenej tag " + result._id + "... Prirazuju jeho id k tomuhle dokumentu");
                    data.tags.push(result._id);
                        data.save((err) => {
        if (err) {
            console.log(err);
        } else {
            console.log('Saved in DB');
        }
    });
                } else { //tag does not exist, create it
                    console.log("nenalezen tag, asi neexistuje: " + thisTag + "... Vytvarim novy a vkladam do DB");
                    let newTag = new Tags({name: thisTag});
                    newTag.save(function (err, tag) {
                        if (err) {
                            console.log("err saving tag");
                        } else {
                            console.log("tag saved under _id: " + tag._id);
                            console.log("associating tag with this article");
                            data.tags.push(tag._id);
                        }
                    });
                }
            }
        });
    }


//TODO: tohle musi bejt az callback po ulozeni tagu jinak se nestihnoout pushnout
    data.save((err) => {
        if (err) {
            console.log(err);
        } else {
            console.log('Saved in DB');
        }
    });
    res.status(200).send(JSON.stringify({message: "OK"}));


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


module.exports = router;