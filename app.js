const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const mysql = require('mysql2');

const app = express();

// Set up database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hybrid_game',
});

// Middleware to parse the body of POST requests
app.use(bodyParser.urlencoded({ extended: true })); // For form submissions
app.use(bodyParser.json()); // For JSON requests

// Session middleware should be applied before routes
app.use(session({
  secret: 'hybrid_game',
  resave: true,
  saveUninitialized: true,
}));

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Connected to the database');

    // Import and use your routes
    const signupRoutes = require('./routes/signup')(db);
    app.use('/', signupRoutes);

    const loginRoutes = require('./routes/login')(db);
    app.use('/', loginRoutes);

    // Middleware to check if the user is logged in
    function checkLoggedIn(req, res, next) {
      if (req.session.loggedin) {
        next();
      } else {
        req.session.error = 'Please Login!';
        res.redirect('/login');
      }
    }

    // Set the view engine to Pug
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'pug');

    // Serve static files
    app.use(express.static(path.join(__dirname, 'public')));

    app.get('/', (req, res) => {
      res.render('start');
    });

    // Routes
    // Modified start route - no login check required
    app.get('/start', (req, res) => {
      res.render('start');
    });

    app.get('/logout', (req, res) => {
      // Clear the session variables
      req.session.destroy((err) => {
        if (err) {
          console.error('Error destroying session:', err);
          return res.status(500).send('Error logging out');
        }
        
        // Clear the session cookie
        res.clearCookie('connect.sid');
        
        // Redirect to the start page
        res.redirect('/start');
      });
    });    

    app.get('/home', checkLoggedIn, (req, res) => {
      const userId = req.session.user.user_id; // Get the logged-in user's ID
    
      // Get all user data from the database
      getUserData(userId)
        .then((userData) => {
          const { 
            username,
            user_email,
            created_at,
            last_played,
            total_games_hosted,
            games_won_as_p1,
            games_won_as_p2,
            total_correct_answers,
            total_rolls
          } = userData;
    
          res.render('home', {
            username,
            user_email,
            created_at,
            last_played,
            total_games_hosted,
            games_won_as_p1,
            games_won_as_p2,
            total_correct_answers,
            total_rolls
          });
        })
        .catch((error) => {
          console.error('Error fetching user data:', error);
          res.status(500).send('Error fetching user data');
        });
    });
    
    // Function to get all user data from the database
    function getUserData(userId) {
      return new Promise((resolve, reject) => {
        db.query(
          'SELECT * FROM users WHERE user_id = ?',
          [userId],
          (err, results) => {
            if (err) {
              reject(err);
            } else {
              resolve(results[0]); // Return the first (and only) result, as user_id is unique
            }
          }
        );
      });
    }

    // Add this with your other routes
    app.post('/home', checkLoggedIn, (req, res) => {
      const userId = req.session.user.user_id; // Get the userId from the session
      
      // Get all user data from the database
      getUserData(userId)
        .then((userData) => {
          const { 
            username,
            user_email,
            created_at,
            last_played,
            total_games_hosted,
            games_won_as_p1,
            games_won_as_p2,
            total_correct_answers,
            total_rolls
          } = userData;

          res.render('home', {
            username,
            user_email,
            created_at,
            last_played,
            total_games_hosted,
            games_won_as_p1,
            games_won_as_p2,
            total_correct_answers,
            total_rolls
          });
        })
        .catch((error) => {
          console.error('Error fetching user data:', error);
          res.status(500).send('Error fetching user data');
        });
    });    
    
    // Add this with your other routes in app.js
    app.post('/logout', (req, res) => {
      // Destroy the session
      req.session.destroy((err) => {
        if (err) {
          console.error('Error destroying session:', err);
          return res.status(500).send('Error logging out');
        }
        
        // Clear the session cookie
        res.clearCookie('connect.sid');
        
        // Redirect to the start page
        res.redirect('/start');
      });
    });

    app.post('/start-game', checkLoggedIn, async (req, res) => {
      try {
        await initializeGame(req);
        res.redirect('/gameboard');
      } catch (error) {
        console.error('Error starting the game:', error);
        res.status(500).send('Error starting the game');
      }
    });

    // Updated route handler for saving game results
    app.post('/save-game-results', checkLoggedIn, (req, res) => {
      const gameResultData = {
        game_id: req.session.current_game_id,
        winner_token: req.body.winner === 1 ? 'player1' : 'player2',
        player1_position: req.body.player1_position,
        player1_correct_answers: req.body.player1_correct_answers,
        player1_incorrect_answers: req.body.player1_incorrect_answers,
        player1_rolls: req.body.player1_rolls,
        player2_position: req.body.player2_position,
        player2_correct_answers: req.body.player2_correct_answers,
        player2_incorrect_answers: req.body.player2_incorrect_answers,
        player2_rolls: req.body.player2_rolls,
      };

      updateUserGameStats(gameResultData)
        .then(() => {
          res.status(200).json({
            status: 'success',
            message: 'Game results and user statistics updated successfully',
          });
        })
        .catch((error) => {
          console.error('Error updating game results and statistics:', error);
          res.status(500).json({
            status: 'error',
            message: 'Failed to update game results and statistics',
          });
        });
    });

    

    app.get('/gameboard', checkLoggedIn, (req, res) => {
      const boardNumbers = generateBoardNumbers();
      const userInfo = req.session.user;
      res.render('gameboard', {
        title: 'Snake and Ladders Game',
        boardNumbers,
        ladders,
        snakes,
        userId: userInfo.user_id,
        username: userInfo.username,
      });
    });

    // Function to generate board numbers
    function generateBoardNumbers() {
      const numbers = [];
      for (let row = 9; row >= 0; row--) {
        const rowNumbers = [];
        if (row % 2 === 0) {
          for (let col = 0; col < 10; col++) {
            rowNumbers.push(row * 10 + col + 1);
          }
        } else {
          for (let col = 9; col >= 0; col--) {
            rowNumbers.push(row * 10 + col + 1);
          }
        }
        numbers.push(...rowNumbers);
      }
      return numbers;
    }

    // Ladders and snakes objects
    const ladders = {
      5: 27,
      12: 32,
      24: 46,
      65: 87,
      62: 84,
    };

    const snakes = {
      43: 19,
      56: 34,
      72: 50,
      95: 88,
    };

    // Initialize Game Function
    async function initializeGame(req) {
      const loggedInUser = req.session.user;
      const gameData = {
        host_player_id: loggedInUser.user_id,
        username: loggedInUser.username,
        date_played: new Date(),
        duration: 0,
        winner_token: null,
      };

      const game_id = await saveNewGame(gameData);
      req.session.current_game_id = game_id;
      req.session.host_player_id = loggedInUser.user_id;
      req.session.username = loggedInUser.username;
    }

    // Function to get all user data from the database
    function getUserData(userId) {
      return new Promise((resolve, reject) => {
        db.query(
          'SELECT * FROM users WHERE user_id = ?',
          [userId],
          (err, results) => {
            if (err) {
              reject(err);
            } else {
              resolve(results[0]); // Return the first (and only) result, as user_id is unique
            }
          }
        );
      });
    }

    // Save New Game to Database and Update Host's Game Count
    function saveNewGame(gameData) {
      return new Promise((resolve, reject) => {
        // Start a transaction to ensure both operations succeed or fail together
        db.beginTransaction(async (err) => {
          if (err) {
            return reject(err);
          }

          try {
            // First, insert the new game
            const [gameResult] = await db.promise().query('INSERT INTO games SET ?', gameData);
            const gameId = gameResult.insertId;

            // Then, increment the total_games_hosted counter for the user
            await db.promise().query(
              'UPDATE users SET total_games_hosted = total_games_hosted + 1 WHERE user_id = ?',
              [gameData.host_player_id]
            );

            // If both operations succeed, commit the transaction
            await db.promise().commit();
            resolve(gameId);

          } catch (error) {
            // If any operation fails, rollback the transaction
            await db.promise().rollback();
            reject(error);
          }
        });
      });
    }

    // Optional: Function to get user's hosting statistics
    function getUserGameStats(userId) {
      return new Promise((resolve, reject) => {
        db.query(
          'SELECT username, total_games_hosted FROM users WHERE user_id = ?',
          [userId],
          (err, results) => {
            if (err) {
              reject(err);
            } else {
              resolve(results[0]);
            }
          }
        );
      });
    }

    // Function to update the 'winner_token' in the 'games' table
    function updateWinnerToken(game_id, winner_token) {
      return new Promise((resolve, reject) => {
        const query = 'UPDATE games SET winner_token = ? WHERE game_id = ?';
        db.query(query, [winner_token, game_id], (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    }

    // Function to save the game results into the database
    function saveGameResults(gameResultData) {
      return new Promise((resolve, reject) => {
        db.query('INSERT INTO game_results SET ?', gameResultData, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    }

    // Function to update game statistics in the users table
    function updateUserGameStats(gameResultData) {
      return new Promise((resolve, reject) => {
        const { 
          game_id, 
          winner_token, 
          player1_correct_answers, 
          player2_correct_answers, 
          player1_rolls, 
          player2_rolls 
        } = gameResultData;
    
        // Get the host player ID and game start time
        db.query(
          'SELECT host_player_id, date_played FROM games WHERE game_id = ?',
          [game_id],
          (err, gameResults) => {
            if (err) {
              return reject(err);
            }
    
            const playerId = gameResults[0].host_player_id;
            const gameStartTime = new Date(gameResults[0].date_played);
            const currentTime = new Date();
    
            // Calculate duration in HH:MM:SS format
            const diffMs = currentTime - gameStartTime;
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
            
            // Format as TIME string HH:MM:SS
            const duration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
            // Start a transaction
            db.beginTransaction(async (err) => {
              if (err) {
                return reject(err);
              }
    
              try {
                // Update all statistics for the player
                await db.promise().query(
                  `UPDATE users 
                   SET total_correct_answers = total_correct_answers + ?,
                       total_rolls = total_rolls + ?,
                       games_won_as_p1 = games_won_as_p1 + ?,
                       games_won_as_p2 = games_won_as_p2 + ?,
                       last_played = NOW()
                   WHERE user_id = ?`,
                  [
                    player1_correct_answers + player2_correct_answers,
                    player1_rolls + player2_rolls,
                    winner_token === 'player1' ? 1 : 0,
                    winner_token === 'player2' ? 1 : 0,
                    playerId
                  ]
                );
    
                // Update winner_token and duration in games table
                await db.promise().query(
                  'UPDATE games SET winner_token = ?, duration = TIME(?) WHERE game_id = ?',
                  [winner_token, duration, game_id]
                );
    
                // Insert the game results
                await db.promise().query('INSERT INTO game_results SET ?', gameResultData);
    
                // Commit the transaction
                await db.promise().commit();
                resolve();
    
              } catch (error) {
                // If any operation fails, rollback the transaction
                await db.promise().rollback();
                reject(error);
              }
            });
          }
        );
      });
    }

    // Export functions for reuse
    module.exports = { 
      initializeGame, 
      saveGameResults, 
      saveNewGame, 
      getUserGameStats, 
      updateUserGameStats, 
      updateWinnerToken,
      getUserData
    };

    // Start the server
    app.listen(3000, () => {
      console.log('Server running on http://localhost:3000');
    });
  }
});
