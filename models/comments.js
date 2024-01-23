const mongoose = require("mongoose")
let {Schema} = mongoose

let commentsSchema = new Schema({
    author:{type:Schema.Types.ObjectId, ref:"User"},
    content:String
})

let Comment = mongoose.model("Comment", commentsSchema)

module.exports = Comment