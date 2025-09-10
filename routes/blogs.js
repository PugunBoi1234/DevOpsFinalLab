const express = require('express');
const router = express.Router();
const db = require('../db'); // Import the database connection

// Middleware to check if user is authenticated
function isLoggedIn(req, res, next) {
    if (req.session.user) {
        return next();
    } else {
        res.redirect('/login');
    }
}

router.get('/blogs', isLoggedIn, (req, res) => {
    res.render('Index', { user: req.session.user });
});

router.get('/post_blog', isLoggedIn, (req, res) => {
    const { title, category, tags, contentEditor} = req.body;
    const userID = req.session.userid;
    const userFullname = req.session.user.first_name=' ' = req.session;

    console.log ('Received blog post data:'), {title, category, tags, contentEditor, userID, userFullname}
});

module.exports = router;

