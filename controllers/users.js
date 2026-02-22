const User = require("../models/user");


// RENDER SIGNUP FORM
module.exports.renderSignupForm = (req, res) => {
    res.render("users/signup");
};

// SIGNUP
module.exports.signup = async (req, res, next) => {
    try {
        let { username, email, password } = req.body;

        const newUser = new User({ email, username });
        const registeredUser = await User.register(newUser, password);
        console.log("User saved:", registeredUser);
    

        req.login(registeredUser, (err) => {
            if (err) {
                return next(err);
            }
            req.flash("success", "Welcome to Wanderlust!");
            res.redirect("/listings");
        });

    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/signup");
    }
};

// RENDER LOGIN FORM
module.exports.renderLoginForm = (req, res) => {
    res.render("users/login");
};

// LOGIN
module.exports.login = async (req, res) => {
    req.flash("success", "Welcome back to Wanderlust!");
    let redirectUrl = res.locals.redirectUrl || "/listings";
    delete req.session.redirectUrl;
    res.redirect(redirectUrl);
};

// LOGOUT
module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "You are successfully logged out!");
        res.redirect("/listings");
    });
};