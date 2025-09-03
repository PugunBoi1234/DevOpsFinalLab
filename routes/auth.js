const express = require('express');
const router = express.Router();
const db = require('../db'); // Import the database connection
const bcrypt = require('bcrypt');

router.get('/', (req, res) => {
    res.render('index', {user: req.session.user });
});

router.get('/login', (req, res) => {
    res.render('login');
});

router.get('/post_blog', (req, res) => {
    res.render('post_blog');
});

router.get('/read_blog', (req, res) => {
    res.render('read_blog');
});

router.get('/register', (req, res) => {
    res.render('register');
});

router.post('/register', async (req, res) => {
    const { fullname, email, password, confirmPassword } = req.body;
    const [first_name, last_name] = fullname.split(' ');

    if (!first_name || !last_name || !email || !password || !confirmPassword) {
        return res.status(400).send('All fields are required');
    }
    
    if (password !== confirmPassword) {
        return res.status(400).send('Passwords do not match');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    db.query('INSERT INTO username (first_name, last_name, email, password, authen) VALUES (?, ?, ?, ?, ?)', 
        [first_name, last_name, email, hashedPassword, 1], (err, results) => {
            if (err) {
                console.error('Error inserting user:', err);
                return res.status(500).send('Internal Server Error');
            }
            console.log('User registered successfully:', results);
            res.redirect('/login'); // Redirect to login page after successful registration
        });

});

router.post('/login', (req, res) => {
    const { email, password } = req.body;
    console.log('Login attempt with email:', email);

    if (!email || !password) {
        return res.status(400).send('Email and password are required');
    }

    db.query('SELECT * FROM username WHERE email = ?', [email], async (err, results) => {
            if (err) {
                console.error('Error fetching user:', err);
                return res.status(404).send('Invalid email or password');
            }

            if (results.length && await bcrypt.compare(password, results[0].password)) {
                
                req.session.user = results[0].email; // Store user email in session

                console.log('User logged in successfully:', results[0]);
                console.log('Session user:', req.session.user);

                
                res.redirect('/blogs'); // Redirect to blog page after successful login
            }
            else {
                console.log('Invalid email or password for email:', email);
                res.status(404).send('Invalid email or password');
            }
        });
});

module.exports = router;
