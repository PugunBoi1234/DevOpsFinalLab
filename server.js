const express = require('express');
const session = require('express-session');
const db = require('./db'); // Import the database connection
const app = express();
const bodyParser = require('body-parser'); // If you need body-parser, otherwise you can use express.json()
require('dotenv').config();


const PORT = process.env.PORT || 3306;

// Middleware
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: false })); // For parsing application/x-www-form-urlencoded
app.use(express.static('public'));

app.use(session({
  secret: process.env.SESSION_SECRET || 'abcdefgh',
  resave: false,
  saveUninitialized: true,
}));

//  Routes:
//app.get('/', (req, res) => {
//    res.render('index');
//});

//app.get('/login', (req, res) => {
//    res.render('login');
//});

app.use('/', require('./routes/auth')); // Import the auth routes
app.use('/', require('./routes/blogs')); // Import the blog routes

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

