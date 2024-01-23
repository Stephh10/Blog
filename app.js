const express = require("express")
const app = express()
const methodOverride = require("method-override")
const mongoose = require("mongoose")
const Post = require("./models/posts")
const Comment = require("./models/comments")
const User = require("./models/users")
const ejsMate = require("ejs-mate")
const ExpressError = require("./errConfig/ExpressError")
const Joi = require("joi")
const {postSch, commSchema} = require("./errConfig/joiValid")
const {isLoggedIn} = require("./middleFunc")
const session = require("express-session")
const path = require('path')

const passport = require("passport")
const passportLocal = require("passport-local")



mongoose
.connect("mongodb://127.0.0.1:27017/myBlog")
.then(() => console.log("Connected to server!"))
.catch((err) => console.log(err))
let sessionConfig = {
    secret: 'kitkat',
    resave: true,
    saveUninitialized: true,
}

app.use(express.urlencoded({ extended: true }));
app.engine("ejs", ejsMate)
app.set("view engine", "ejs")
app.use(methodOverride('_method'))
app.use(session(sessionConfig))
app.use('/static', express.static(path.join(__dirname,  'public')))

app.use(passport.initialize())
app.use(passport.session())
passport.use(new passportLocal(User.authenticate()))

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
  });

let validatePost = ((req,res,next) => {
    let {error} = postSch.validate(req.body)
    if(error) {
        let msg = error.details.map((err) => err.message).join(",")
        throw new ExpressError(msg, 405)
    }
    else {
        next()
    }
})

let validateComment = ((req,res,next) => {
    let {error} = commSchema.validate(req.body)
    if(error) {
        let msg = error.details.map((err) => err.message).join(",")
        throw new ExpressError(msg, 405)
    }
    else {
        next()
    }
})
app.get("/posts", async(req,res) => {
    let posts = await Post.find({}).populate("author")
    res.render("posts/main", { posts })
})

app.get("/posts/new",isLoggedIn, (req,res) => {
    res.render("posts/new")
})

app.post("/posts/new",validatePost,async(req,res) => {
    let post = new Post(req.body.posts)
    post.author = req.user._id
    await post.save()
    res.redirect("/posts")
})

app.get("/posts/:id",isLoggedIn, async(req,res) => {
    let {id} = req.params
    let post = await Post.findById(id).populate({
        path:"comments",
        populate:{
            path:"author"
        }
    }).populate("author")
    res.render("posts/show", {post})
})

app.get("/posts/:id/edit", async(req,res) => {
    let {id} = req.params
    let post = await Post.findById(id)
    res.render("posts/edit", {post})
})

app.put("/posts/:id",validatePost,async(req,res) => {
    let {id} = req.params
    await Post.findByIdAndUpdate(id,{... req.body.posts})
    res.redirect(`/posts/${id}`)
})

app.delete("/posts/:id", async(req,res) => {
    let {id} = req.params
    await Post.findByIdAndDelete(id)
    res.redirect("/posts")
})

// COMMENT

app.post("/posts/:id/comment",validateComment, async(req,res) => {
    let {id} = req.params
    let post = await Post.findById(id)
    let newComment = new Comment(req.body.comment)
    newComment.author = req.user._id
    post.comments.push(newComment)
    await newComment.save()
    await post.save()
    res.redirect(`/posts/${id}`)
})

app.delete("/posts/:id/comment/:commentId", async(req,res) => {
    let {id, commentId} = req.params
    await Post.findByIdAndUpdate(id,{$pull:{comments:commentId}})
    await Comment.findByIdAndDelete(commentId)
    res.redirect(`/posts/${id}`)
})

// USER


app.get("/register", (req,res) => {
    res.render("users/register")
})

app.post("/register", async(req,res) => {
    let {username, password, email} = req.body
    let user = new User({username,email})
    let validUser = await User.register(user,password)
    if(validUser) {
        req.login(validUser, function(err) {
            if(err) {
                throw new ExpressError(err, 405)
            }
            res.redirect("/posts")
        })
    }
})

app.get("/login", (req,res) => {
    res.render("users/login")
})

app.post("/login", passport.authenticate("local", {failureRedirect:"/login"}), (req,res) => {
    res.redirect("/posts")
})

app.get("/logout", (req,res) => {
    req.logout(function(err) {
        if(err) {
            throw new ExpressError(err,405)
        }else {
            res.redirect("/login")
        }
    })
})


app.all("*", (req,res,next) => {
    throw new ExpressError("Page not found", 404)
})

app.use((err,req,res,next) => {
    let {status} = err
    if(!err.message) err.message = "Something went wrong"
    res.status(status).render("error", {err})
})

app.listen(3000, () => {
    console.log("Server started")
})