const Listing = require("../models/listing");
const ExpressError = require("../utils/ExpressError");
const { cloudinary } = require("../cloudConfig");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAP_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapToken });


// INDEX  --- to  show all list
module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
};

// NEW FORM ---- when we click create new route we use this
module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};


// CREATE ---- kothaga create chesina list ni list loki add cheydaniki
module.exports.createListing = async (req, res) => {
    const geoData = await geocoder.forwardGeocode({
        query: req.body.listing.location,
        limit: 1
    }).send();
    const newListing = new Listing(req.body.listing);
    newListing.geometry = geoData.body.features[0].geometry;
    newListing.owner = req.user._id;

    newListing.image = {
        url: req.file.path,
        filename: req.file.filename,
    };

    await newListing.save();

    req.flash("success", "New listing created!");
    console.log("Saved ID:", newListing._id);
    res.redirect(`/listings/${newListing._id}`);
};


// SHOW   --- unna list ni brief ga chudaniki
module.exports.showListing = async (req, res) => {
    let { id } = req.params;

    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: { path: "author" },
        })
        .populate("owner");

    if (!listing) {
        throw new ExpressError(404, "Listing not found");
    }

    res.render("listings/show.ejs", { listing });
};

// EDIT FORM ---manam click chesina list edit cheydanki
module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs", { listing });
};

// UPDATE -- edit chesina list ni malli list loki add cheydaniki
module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findByIdAndUpdate(
        id,
        { ...req.body.listing },
        { new: true }
    );
    if (typeof req.file !== "undefined") {

        // Delete old image from Cloudinary
        await cloudinary.uploader.destroy(listing.image.filename);

        //  Save new image info
        listing.image = {
            url: req.file.path,
            filename: req.file.filename,
        };

        await listing.save();
    }

    req.flash("success", "Listing updated successfully!");
    res.redirect(`/listings/${id}`);
};

// DELETE -- to delte
module.exports.deleteListing = async (req, res) => {
    let { id } = req.params;

    await Listing.findByIdAndDelete(id);

    req.flash("success", "Listing deleted successfully!");
    res.redirect("/listings");
};