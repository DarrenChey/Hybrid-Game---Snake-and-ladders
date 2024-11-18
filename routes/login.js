const express = require('express');
const router = express.Router();

module.exports = (db) => {
  // GET handler renders the login page
  router.get('/login', (req, res) => {
    res.render('login');
  });

  // POST handler handles form submissions from the login page
  router.post('/login', (req, res) => {
    const user_email = req.body.user_email;
    const user_password = req.body.user_password;
  
    // Validate that both email and password are provided
    if (user_email && user_password) {
      // Query to check if the user exists with provided email and password
      db.query('SELECT * FROM users WHERE user_email = ? AND user_password = ?', [user_email, user_password], (error, results, fields) => {
        if (error) {
          console.error("Database error: ", error);
          req.session.error = 'Database error';
          return res.redirect('/login');
        }
  
        // If a user is found with matching credentials
        if (results.length > 0) {
          req.session.loggedin = true;
          req.session.user = results[0]; // Store the entire user data in the session
          res.redirect('/home');
        } else {
          // If credentials are incorrect, render the login page with an error message
          res.render('login', {
            error: 'Incorrect Email or Password!'
          });
          res.end();
        }
      });
    } else {
      // If email or password is missing, render the login page with an error message
      res.render('login', {
        error: 'Please enter Email and Password!'
      });
      res.end();
    }
  });

  return router;
};