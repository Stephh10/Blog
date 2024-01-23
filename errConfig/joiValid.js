let Joi = require("joi")

module.exports.postSch = Joi.object({
    posts:Joi.object({
        title:Joi.string().required(),
        description:Joi.string().required()
    }).required()
})

module.exports.commSchema = Joi.object({
    comment:Joi.object({
        content:Joi.string().required()
    }).required()
})