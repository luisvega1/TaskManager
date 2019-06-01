const mongoose = require('mongoose');

const ListSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        minlength: 1,
        trim: true
    },
    // con auth
    _userId: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    date: {
        type: Date,
        default: Date.now()
    }
})

const List = mongoose.model('List', ListSchema);

module.exports = { List }