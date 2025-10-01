const express = require('express');
const router = express.Router();
const db = require('../db'); // Import the database connection
const bcrypt = require('bcrypt');

// Render pages
router.get('/', (req, res) => {
  db.query('SELECT * FROM blog', (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.render('index', { user: req.session.user, blogs: [
        { id: 1, title: 'Test Blog', content: 'This is a test blog.' },
        { id: 2, title: 'Another Blog', content: 'This is another test blog.' }
      ] });
    }
    if (!results || results.length === 0) {
      console.warn('No blogs found in the database.');
      return res.render('index', { user: req.session.user, blogs: [
        { id: 1, title: 'Test Blog', content: 'This is a test blog.' },
        { id: 2, title: 'Another Blog', content: 'This is another test blog.' }
      ] });
    }
    console.log('Fetched blogs:', results); // Debugging log
    res.render('index', { user: req.session.user, blogs: results });
  });
});
router.get('/login', (req, res) => {
  res.render('login', { error: null, user: req.session.user });
});
router.get('/register', (req, res) => {
  res.render('register', { error: null, user: req.session.user });
});
router.get('/post_blog', (req, res) => {
  res.render('post_blog', { user: req.session.user });
});
router.get('/read_blog', (req, res) => {
  res.render('read_blog', { user: req.session.user });
});

// Handle user registration
router.post('/register', async (req, res) => {
  const { fullName, email, password, confirmPassword } = req.body;
  const [first_name, last_name] = fullName.split(' ');

    if (!first_name || !last_name || !email || !password || !confirmPassword) {
      return res.status(400).send('All fields are required.');
    }

    if (password !== confirmPassword) {
      return res.status(400).send('Passwords do not match.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user already exists
    db.query('SELECT * FROM username WHERE email = ?', [email], async (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).render('register', { error: 'Internal server error.' });
      }

      if (results.length > 0) {
        return res.status(400).render('register', { error: 'Email already registered.' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new user
      db.query(
        'INSERT INTO username (first_name, last_name, email, password, authen) VALUES (?, ?, ?, ?, ?)',
        [first_name, last_name, email, hashedPassword, 1], (err, results) => {
          if (err) {
            console.error('Error inserting user:', err);
            return res.status(500).send('Internal server error.');
          }
          console.log('User registered successfully:', results);
          res.redirect('/login');
        });

    });
});

// Handle user login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt with email:', email);

  if (!email || !password) {
    return res.status(400).send('Email and password are required.');
  }

  db.query('SELECT * FROM username WHERE email = ?', [email], async (err, results) => {
    if (err) {
      console.error('Error fetching user:', err);
      return res.status(404).send('Invalid email or password.');
    }

    if (results.length && await bcrypt.compare(password, results[0].password)) {

      req.session.user = results[0].email;
      
      console.log('User logged in successfully:', results[0]);
      console.log('Session ID:', req.session.id);
      console.log('Session user:', req.session.user);
      res.redirect('/blogs');

    } 
    else {
      console.log('Invalid email or password for email:', email);
      res.status(401).send('Invalid email or password.');
    }
  });
});
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    res.redirect('/login'); // Redirect to homepage after logout
  });
});

module.exports = router;