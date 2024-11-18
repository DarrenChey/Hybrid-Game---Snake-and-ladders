const express = require('express');

module.exports = (db) => {
  const router = express.Router();

  // Render the sign-up form
  router.get('/signup', (req, res) => {
    // If user is already logged in, redirect to home
    if (req.session && req.session.loggedin) {
      return res.redirect('/home');
    }
    res.render('signup');
  });

  // Handle sign-up form submission
  router.post('/signup', (req, res) => {
    const { username, user_email, user_password, confirm_password } = req.body;

    console.log('Received signup data:', {
      username,
      user_email,
      user_password: user_password ? '[PRESENT]' : '[MISSING]',
      confirm_password: confirm_password ? '[PRESENT]' : '[MISSING]'
    });

    // Validation
    if (!username || !user_email || !user_password || !confirm_password) {
      return res.status(400).render('signup', {
        error: 'All fields are required'
      });
    }

    // Check if passwords match
    if (user_password !== confirm_password) {
      return res.status(400).render('signup', {
        error: 'Passwords do not match'
      });
    }

    // Check if email already exists
    db.query(
      'SELECT * FROM users WHERE user_email = ?',
      [user_email],
      (err, results) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).render('signup', {
            error: 'An error occurred during registration'
          });
        }
        
        if (results.length > 0) {
          return res.status(400).render('signup', {
            error: 'Email already registered'
          });
        }

        // Prepare user data with default values
        const userData = {
          username,
          user_email,
          user_password,
          created_at: new Date(),
          last_played: null,
          total_games_hosted: 0,
          games_won_as_p1: 0,
          games_won_as_p2: 0,
          total_correct_answers: 0,
          total_rolls: 0
        };

        // Insert new user
        db.query(
          'INSERT INTO users SET ?',
          userData,
          (err, result) => {
            if (err) {
              console.error('Error creating user:', err);
              return res.status(500).render('signup', {
                error: 'Error creating user account'
              });
            }

            // Redirect to login page with success message
            res.render('login', {
              success: 'Registration successful! Please login with your credentials.'
            });
          }
        );
      }
    );
  });

  return router;
};