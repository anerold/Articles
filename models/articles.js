let mongoose = require('mongoose');
let articlesSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    publishDate: {
        type: String,
        required: true

    },
    authorName: {
        type: String,
        required: true

    },
    lastModified: {
        type: Date,
        required: false

    },
    createdAt: {
        type: Date,
        required: true

    },
    tags: {
        type: Array,
        required: true
    }

});

let Articles = module.exports = mongoose.model('Articles', articlesSchema);