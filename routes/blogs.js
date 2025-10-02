const express = require('express');
const router = express.Router();
const db = require('../db'); // Import the database connection

// Step 1 - Configuration
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Step 2 - Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir,{recursive: true});
}

// Step 3 - Set up multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Directory to save uploaded files
    },
    filename: function (req, file, cb) {
        const safeName = file.originalname.replace(/\s+/g, '-').toLowerCase();
        cb(null, Date.now() + '-' + safeName); // Unique filename
    }
});

// Step 4 - File filter to allow only images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true); // Accept file      
    } else {
        cb(new Error('Only image files are allowed!'), false); // Reject file
    }  
};

// Step 5 - Initialize multer with storage and file filter
const upload = multer({ storage: storage, fileFilter: fileFilter, limits: { fileSize: 1 * 1024 * 1024 } }); // Limit file size to 1MB

function isLogged(req, res, next) {
  if (req.session && req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
}

router.get('/blogs', isLogged, (req, res) => {

  db.query('SELECT * FROM blog ORDER BY idblog', (err, results) => {
    if (err || !results) {
      console.error('Error fetching blogs:', err);
      return res.status(500).send('Internal server error');
    }
    console.log('Fetched blogs:', results);
    res.render('index', { user: req.session.user, blogs: results });
  });

});

  

    
router.get('/post_blog', isLogged, (req, res) => {
    res.render('post_blog', { user: req.session.user });
});

router.post('/post_blog', isLogged, upload.single('imageInput'), (req, res) => {
  try {
    const {title, category, tags, hiddenContent} = req.body;
    if (!title || !title.trim()) {
      return res.status(400).send('Error: Title is required.');
    }
    if (!hiddenContent || !hiddenContent.trim()) {
      return res.status(400).send('Error: Content is required.');
    }
    // ดึงข้อมูล user จาก session (กรณี session.user เป็น email ให้ query user ก่อน)
    let userid = null;
    let userFullName = null;
    if (req.session.user && typeof req.session.user === 'object') {
      userid = req.session.user.id;
      userFullName = req.session.user.first_name + ' ' + req.session.user.last_name;
    } else if (req.session.user) {
      // ถ้า session.user เป็น email ให้ query user
      db.query('SELECT * FROM username WHERE email = ?', [req.session.user], (err, results) => {
        if (err || !results.length) {
          return res.status(401).send('User not found.');
        }
        userid = results[0].id;
        userFullName = results[0].first_name + ' ' + results[0].last_name;
        saveBlog();
      });
      return;
    }
    saveBlog();

    function saveBlog() {
      const imageFilename = req.file ? req.file.filename : null;
      db.query(
        'INSERT INTO blog (blog_title, idcategory, blog_tag, blog_detail, blog_image, iduser, blog_author) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [title, category, tags, hiddenContent, imageFilename, userid, userFullName],
        (err, result) => {
          if (err) {
            console.error('❌ Error saving blog:', err);
            return res.status(500).send('Error saving blog post.');
          }
          res.redirect('/');
        }
      );
    }
  } catch (error) {
    console.error('❌ Error processing blog post:', error);
    res.status(500).send('Internal server error: ' + error.message);
  }
});

module.exports = router;