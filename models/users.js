const mongoose = require("mongoose")
const {Schema} = mongoose
let passportMongoose = require("passport-local-mongoose")

let userSchema = new Schema({
    email:String
})

userSchema.plugin(passportMongoose)
let User = mongoose.model("User", userSchema)

module.exports = User