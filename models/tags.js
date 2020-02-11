let mongoose = require('mongoose');
let TagsSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    articles: {
        type: Array,
        required: true
    }

});

let Tags = module.exports = mongoose.model('Tags', TagsSchema);