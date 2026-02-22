const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("../schema.js");
const Listing = require("../models/listing.js");
const {isLoggedIn} = require("../middleware.js");
const {isOwner} = require("../middleware.js");
const listingController = require("../controllers/listing");
const multer  = require("multer");
const {storage} = require("../cloudConfig.js")
const upload = multer({storage});
const { cloudinary } = require("../cloudConfig");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAP_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapToken });



/// schemavalidation for listings - to make sure no empty listings were added to databases form server side
const validateListing = (req, res, next) => {
    let { error } = listingSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};



///////////// all below routers ae connected to controllers , where main funtionally will be held


/// index route --- to show all lists
router.get("/", wrapAsync(listingController.index));


//new route -- when we click create new list we use this
router.get("/new" , isLoggedIn,listingController.renderNewForm);



// create route --- kothaga create chesina list ni list lo add cheyadaniki
router.post("/",isLoggedIn, upload.single("listing[image]"),validateListing,wrapAsync(listingController.createListing));


//show route --- una list lo oka dani brief ga chudadaniki
router.get("/:id" ,wrapAsync(listingController.showListing));

//edit route -- manam click chesina id ni edit cheydaniki
router.get("/:id/edit",isLoggedIn,isOwner,wrapAsync(listingController.renderEditForm));


// update route -- manam edit chesina route ni malli listing loki pampadaniki
router.put("/:id",isLoggedIn,isOwner, upload.single("listing[image]"), validateListing,wrapAsync(listingController.updateListing));




// delete any route
router.delete("/:id",
    isLoggedIn,
    isOwner,
    wrapAsync(listingController.deleteListing));


// Reserve page
router.get("/:id/reserve", isLoggedIn, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/reserve", { listing });
}));

// Confirm booking
router.post("/:id/book", isLoggedIn, wrapAsync(async (req, res) => {

    const { id } = req.params;
    const { checkin, checkout } = req.body;

    const listing = await Listing.findById(id);

    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);

    const timeDiff = checkoutDate - checkinDate;
    const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    const totalPrice = days * listing.price;

    res.render("listings/confirmation", {
        listing,
        checkin,
        checkout,
        days,
        totalPrice
    });
}));


module.exports = router;