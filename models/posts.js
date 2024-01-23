const mongoose = require("mongoose")
let Comment = require("./comments")
let {Schema} = mongoose

let postsSchema = new Schema({
    title:String,
    description:String,
    author:{type:Schema.Types.ObjectId, ref:"User"},
    comments:[{type:Schema.Types.ObjectId, ref:"Comment"}]
})

postsSchema.post("findOneAndDelete", async function(dir) {
    if(dir) {
        await Comment.deleteMany({
            _id:{
                $in:dir.comments
            }
        })
    }
})

let Post = mongoose.model("Post", postsSchema)

module.exports = Post