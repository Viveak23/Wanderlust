if(process.env.NODE_ENV != "production"){
    require('dotenv').config();
}
const { cloudinary } = require("./cloudConfig");
console.log(process.env.SECRET);
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dbUrl = process.env.ATLASDB_URL
const Listing = require("./models/listing");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync");
const ExpressError = require("./utils/ExpressError");
const{listingSchema, reviewSchema}= require("./schema.js");
const Review = require("./models/review.js");
const listingrouter = require("./routes/listing.js");
const reviewsrouter= require("./routes/review.js");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("./models/user.js");
const Userrouter = require("./routes/user.js");

mongoose.set("strictQuery", true);
main().then(()=>{
    console.log("db connected");
}).catch( err=>{
    console.log(err);
})

async function main(){
    await mongoose.connect(dbUrl);
}

mongoose.connection.on("connected", () => {
    console.log("Connected to DB:", mongoose.connection.name);
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname,"/public")));



const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600,
});

store.on("error" , ()=>{
    console.log("Error in Mongo session store",err);
});

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};




app.use(session(sessionOptions));
app.use(flash());                  // for flash alerts

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next) =>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    res.locals.mapToken = process.env.MAP_TOKEN;
    next();
});

app.use("/listings",listingrouter);                    ////→ Connect listing routes
app.use("/listings/:id/reviews",reviewsrouter);       //// → Connect nested review routes under listing
app.use("/",Userrouter);

app.use((req,res,next)=>{
    next(new ExpressError(404,"page Not Found"));
});


// middleware - whenever we enter the data which doesnot saticify the schema then middleware are used to display the errors
app.use((err,req,res,next)=>{
    let {statusCode=500,message="Something went wrong"} = err;
    res.status(statusCode).render("error",{err});
});


const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});