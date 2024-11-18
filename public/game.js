
let currentPlayer = 1;
let canRollAgain = false;  // Add this declaration
let isWaitingForCardInput = false;
let isAnimating = false; // New state variable to track animation status

const positions = {
    p1: 1,  // Start at position 1
    p2: 1
};

const playerStats = {
    p1: {
        totalRolls: 0,
        lastRoll: '-'
    },
    p2: {
        totalRolls: 0,
        lastRoll: '-'
    }
};

const ladders = {
    5: 27,
    12: 32,
    24: 46,
    65: 87,
    62: 84
};

const snakes = {
    43: 19,  
    56: 34,  
    72: 50,  
    95: 88   
};

const gameStats = {
    player1: {
        correctAnswers: 0,
        incorrectAnswers: 0
    },
    player2: {
        correctAnswers: 0,
        incorrectAnswers: 0
    }
};

function getCell(number) {
    let row = Math.floor((number - 1) / 10);
    let col = (number - 1) % 10;

    if (row % 2 === 1) {
        col = 9 - col;
    }

    const index = (9 - row) * 10 + col;
    return document.querySelector(`.cell:nth-child(${index + 1})`);
}


// Modified question system to work with physical cards
const cardCategories = {
    BASIC: "Basic Python",
};

const questionPositions = {
    3: cardCategories.BASIC,
    8: cardCategories.BASIC,
    13: cardCategories.BASIC,
    18: cardCategories.BASIC,
    21: cardCategories.BASIC,
    28: cardCategories.BASIC,
    31: cardCategories.BASIC,
    40: cardCategories.BASIC,
    41: cardCategories.BASIC,
    48: cardCategories.BASIC,
    67: cardCategories.BASIC,
    73: cardCategories.BASIC,
    77: cardCategories.BASIC,
    80: cardCategories.BASIC,
    85: cardCategories.BASIC,
    92: cardCategories.BASIC,
    97: cardCategories.BASIC,

};


function animateTokenSlide(player, start, end, callback) {
    isAnimating = true; // Set animation state to true when starting
    let currentPosition = start;
    const slideDuration = 800;

    // Define diagonal movement logic for ladders and snakes
    const diagonalMovements = {
        // Existing ladder movements
        5: [5, 15, 27],     
        12: [12, 29, 32],    
        24: [24, 36, 46],  
        65: [65, 75, 87],    
        62: [62, 78, 84],
        // Snake movements
        43: [43, 38, 39, 22, 23, 19],    
        56: [56, 46, 35, 34],    
        72: [72, 69, 52, 51, 50],    
        95: [95, 87, 88]     
    };

    // Check if the current move is a ladder or snake requiring diagonal movement
    if (diagonalMovements[start] && diagonalMovements[start][diagonalMovements[start].length - 1] === end) {
        const diagonalPositions = diagonalMovements[start];
        let currentStep = 0;

        function slideStep() {
            const stepStart = diagonalPositions[currentStep];
            const stepEnd = diagonalPositions[currentStep + 1];

            movePlayer(player, stepStart);
            setTimeout(() => {
                currentPosition = stepEnd;
                movePlayer(player, currentPosition);

                currentStep++;
                if (currentStep < diagonalPositions.length - 1) {
                    setTimeout(slideStep, 100);
                } else {
                    isAnimating = false; // Reset animation state when done
                    if (callback) callback();
                }
            }, 800);
        }

        slideStep();
        return end;
    }

    // Regular animation for normal moves
    const startTime = performance.now();

    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / slideDuration, 1);
        currentPosition = Math.floor(start + (end - start) * progress);

        movePlayer(player, currentPosition);
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            isAnimating = false; // Reset animation state when done
            if (callback) callback();
        }
    }
    requestAnimationFrame(animate);
}


// Update movePlayer function to add transition
function movePlayer(player, position) {
    const oldToken = document.querySelector(`.p${player}-token`);
    if (oldToken) {
        oldToken.remove();
    }

    if (position >= 0) {
        const cell = getCell(position || 1);
        if (cell) {
            const token = document.createElement('div');
            token.className = `player-token p${player}-token`;
            token.style.backgroundColor = player === 1 ? 'red' : 'blue';
            token.style.position = 'absolute';
            token.style.left = player === 1 ? '25%' : '75%';
            token.style.top = '50%';
            token.style.transform = 'translate(-50%, -50%)';
            token.style.width = '20px';
            token.style.height = '20px';
            token.style.borderRadius = '50%';
            token.style.transition = 'all 0.3s ease-in-out'; // Smoother transition
            cell.appendChild(token);
        }
    }
}




// Update the main game logic to check for both ladders and snakes
function checkForLadderAndSnake(position, player) {
    // First check for ladder
    if (ladders[position]) {
        const ladderTop = ladders[position];
        setTimeout(() => {
            animateTokenSlide(player, position, ladderTop, null);
        }, 500);
        return ladderTop;
    }
    // Then check for snake
    else if (snakes[position]) {
        const snakeBottom = snakes[position];
        setTimeout(() => {
            animateTokenSlide(player, position, snakeBottom, null);
        }, 500);
        return snakeBottom;
    }
    return position;
}


function updateScore(player, position) {
    const scoreElement = document.getElementById(`p${player}-score`);
    if (scoreElement) {
        scoreElement.textContent = `P${player}: ${position}`;
    }
}

function updatePlayerStats(player, roll) {
    playerStats[`p${player}`].totalRolls++;
    playerStats[`p${player}`].lastRoll = roll;

    // Update the display
    document.getElementById(`p${player}-total-rolls`).textContent = playerStats[`p${player}`].totalRolls;
    document.getElementById(`p${player}-roll-message`).textContent = `Player ${player} rolled a ${roll}`;  // Add this line

}

function updateBoardBorder() {
    const board = document.querySelector('.board');
    board.classList.remove('player1-turn', 'player2-turn');
    board.classList.add(`player${currentPlayer}-turn`);
}


function showCardPrompt(position) {
    isWaitingForCardInput = true;
    const category = questionPositions[position];
    
    const modal = document.getElementById('card-prompt-modal');
    modal.style.display = 'block';
}


// Update the function that handles the turn indicator
function updateTurnIndicator() {
    const turnIndicator = document.getElementById('current-player');
    turnIndicator.textContent = `Player ${currentPlayer}'s turn`;
    turnIndicator.className = `player${currentPlayer}-turn`;
}

// Modify the roll dice event listener to use the new function
document.getElementById('roll-dice').addEventListener('click', function () {
    // Check if animation is in progress or other conditions prevent rolling
    if (positions[`p${currentPlayer}`] >= 100 || isWaitingForCardInput || isAnimating) {
        return;
    }

    const diceRoll = Math.floor(Math.random() * 6) + 1;
    updatePlayerStats(currentPlayer, diceRoll);

    let newPosition = positions[`p${currentPlayer}`] + diceRoll;
    
    if (newPosition > 100) {
        newPosition = positions[`p${currentPlayer}`];
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        updateBoardBorder();
        updateTurnIndicator();
    } else {
        const previousPosition = positions[`p${currentPlayer}`];
        positions[`p${currentPlayer}`] = newPosition;
        
        updateScore(currentPlayer, newPosition);

        animateTokenSlide(currentPlayer, previousPosition, newPosition, () => {
            if (questionPositions[newPosition]) {
                showCardPrompt(newPosition);
            } else {
                const finalPosition = checkForLadderAndSnake(newPosition, currentPlayer);
                positions[`p${currentPlayer}`] = finalPosition;
                updateScore(currentPlayer, finalPosition);
                
                if (finalPosition === 100) {
                    setTimeout(() => {
                        showGameStats(
                            currentPlayer, // winner
                            gameStats,
                            positions,
                            playerStats
                        );
                    }, 1000);
                } else {
                    currentPlayer = currentPlayer === 1 ? 2 : 1;
                    updateBoardBorder();
                    updateTurnIndicator();
                }
            }
        });
    }
});


// Update the handleAnswer function to use the new turn indicator
function handleAnswer(isCorrect) {
    isWaitingForCardInput = false;
    const modal = document.querySelector('.card-prompt-modal');
    
    if (isCorrect) {
        gameStats[`player${currentPlayer}`].correctAnswers++;
        alert("Correct! You get a bonus roll!");
        canRollAgain = true;
    } else {
        gameStats[`player${currentPlayer}`].incorrectAnswers++;
        alert("Incorrect. Move to next player's turn.");
        canRollAgain = false;
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        updateBoardBorder();
        updateTurnIndicator();
    }
    
    if (modal) {
        modal.style.display = 'none';
    }
}


function showGameStats(winner, gameStats, positions, playerStats) {
    // Get modal element
    const modal = document.getElementById('stats-modal');
    
    // Update Player 1 stats
    document.getElementById('player1-stats').className = `player-stats-box ${winner === 1 ? 'winner' : ''}`;
    document.getElementById('player1-title').innerHTML = `Player 1 ${winner === 1 ? '👑' : ''}`;
    document.getElementById('p1-final-position').textContent = `Square [${positions.p1}]`;
    document.getElementById('p1-correct').textContent = `[${gameStats.player1.correctAnswers}]`;
    document.getElementById('p1-incorrect').textContent = `[${gameStats.player1.incorrectAnswers}]`;
    document.getElementById('p1-total').textContent = `[${playerStats.p1.totalRolls}]`;

    // Update Player 2 stats
    document.getElementById('player2-stats').className = `player-stats-box ${winner === 2 ? 'winner' : ''}`;
    document.getElementById('player2-title').innerHTML = `Player 2 ${winner === 2 ? '👑' : ''}`;
    document.getElementById('p2-final-position').textContent = `Square [${positions.p2}]`;
    document.getElementById('p2-correct').textContent = `[${gameStats.player2.correctAnswers}]`;
    document.getElementById('p2-incorrect').textContent = `[${gameStats.player2.incorrectAnswers}]`;
    document.getElementById('p2-total').textContent = `[${playerStats.p2.totalRolls}]`;

    // Show modal
    modal.style.display = 'block';

    // Add click handler for quit button
    const quitButton = document.getElementById('quit-button');
    quitButton.addEventListener('click', () => {
        // Send the game results before removing the modal
        saveGameResults(winner, gameStats, positions, playerStats);

        // Hide modal
        modal.style.display = 'none';

        // Reload or reset the game
        window.location.reload();
    });
}

// The function to save game results to the server
function saveGameResults(winner, gameStats, positions, playerStats) {
    const gameData = {
        winner: winner,
        player1_position: positions.p1,
        player2_position: positions.p2,
        player1_correct_answers: gameStats.player1.correctAnswers,
        player2_correct_answers: gameStats.player2.correctAnswers,
        player1_incorrect_answers: gameStats.player1.incorrectAnswers,
        player2_incorrect_answers: gameStats.player2.incorrectAnswers,
        player1_rolls: playerStats.p1.totalRolls,
        player2_rolls: playerStats.p2.totalRolls
    };

    // Send the game data to the server using fetch
    fetch('/save-game-results', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(gameData)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Game results saved:', data);
    })
    .catch(error => {
        console.error('Error saving game results:', error);
    });
}


// Initialize the turn indicator when the game starts
window.addEventListener('load', () => {
    updateTurnIndicator();
});

// Initialize tokens at position 1
movePlayer(1, 1);
movePlayer(2, 1);


