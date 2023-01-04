const express = require('express')
const app = express()
const path = require('path')
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const Joi = require('joi');
const {campgroundSchema, reviewSchema} = require('./schemas.js');
const catchAsync = require('./utils/catchAsync');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const Campground = require('./models/campground');
const Review = require('./models/review');
const review = require('./models/review');


mongoose.connect('mongodb://localhost:27017/yelp-camp', {
    useNewUrlParser: true,
    // useCreateIndex: true, unsupported
    useUnifiedTopology: true
})

const db = mongoose.connection;
db.on("error", console.error.bind(console,"connection error:"));
db.once("open", () => {
    console.log("Database connected")
})

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname,'views'))
app.use(express.urlencoded({extended: true}))
app.use(methodOverride('_method'))

app.get('/',(req,res)=>{
    res.render('home')
})

// app.get('/makecampground', async (req,res) =>{
//     const camp = new Campground({title:'My Backyard', description:'Cheap Camping!' })
//     await camp.save();
//     res.send(camp)
// })

const validateCampground = (req, res, next) => {
       const {error} = campgroundSchema.validate(req.body);
       if(error){
        const msg = error.details.map(el => el.message).join(','); //returns a signle new string that we join
        throw new ExpressError(msg,400);
       } else{
        next();
       }
}

const validateReview = (req, res, next) => {
    const {error} = reviewSchema.validate(req.body);
    if(error){
        const msg = error.details.map(el => el.message).join(','); //returns a signle new string that we join
        throw new ExpressError(msg,400);
       } else{
        next();
       }    
}

app.get('/campgrounds', catchAsync(async (req,res) =>{
    const campgrounds = await Campground.find({}); //grabs all campground in db
    res.render('campgrounds/index', {campgrounds})
}))

app.get('/campgrounds/new', (req,res) =>{
    res.render('campgrounds/new');
})

app.post('/campgrounds', validateCampground, catchAsync(async (req,res, next) =>{
    //checks to see if req.body contains campground
   // if(!req.body.campground) throw new ExpressError('Invalid Campground Data', 400);
    
    const campground = new Campground(req.body.campground);
    await campground.save();
    res.redirect(`/campgrounds/${campground._id}`)
      
}))

app.get('/campgrounds/:id', catchAsync(async (req,res) =>{
    const campground = await Campground.findById(req.params.id)
    res.render('campgrounds/show', {campground});
}))

app.get('/campgrounds/:id/edit', catchAsync(async (req,res) =>{
    const campground = await Campground.findById(req.params.id)
    res.render('campgrounds/edit', {campground});
}))

app.put('/campgrounds/:id', validateCampground, catchAsync(async (req,res) =>{
    const {id} = req.params;
    const campground = await Campground.findByIdAndUpdate(id, {...req.body.campground})
    res.redirect(`/campgrounds/${campground._id}`)
}))

app.delete('/campgrounds/:id', catchAsync(async (req,res) =>{
    const {id} = req.params;
    await Campground.findByIdAndDelete(id);
    res.redirect('/campgrounds');
}))

app.post('/campgrounds/:id/reviews', validateReview, catchAsync(async(req, res) =>{
    const campground = await Campground.findById(req.params.id);
    const review = new Review(req.body.review);
    campground.reviews.push(review);
    await review.save();
    await campground.save();
    res.redirect(`/campgrounds/${campground._id}`);
}))
//app.all for every single request. and * for every path
app.all('*', (req, res, next) =>{
    //res.send('404!')
    next(new ExpressError('Page Not Found', 404));
})

app.use((err, req, res, next)=>{
    const {statusCode = 500} = err;
    if(!err.message) err.message = 'Oh no, something went wrong!';
    res.status(statusCode).render('error', {err});
    //won't hit yet, need to handle async error
})
app.listen(3000, ()=>{
    console.log("port 3000")
})