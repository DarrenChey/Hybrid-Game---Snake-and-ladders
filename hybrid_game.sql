-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 10, 2024 at 10:51 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `hybrid_game`
--

-- --------------------------------------------------------

--
-- Table structure for table `games`
--

CREATE TABLE `games` (
  `game_id` int(11) NOT NULL,
  `host_player_id` int(11) DEFAULT NULL,
  `username` varchar(255) NOT NULL,
  `date_played` datetime DEFAULT NULL,
  `duration` time(6) DEFAULT '00:00:00.000000',
  `winner_token` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `games`
--

INSERT INTO `games` (`game_id`, `host_player_id`, `username`, `date_played`, `duration`, `winner_token`) VALUES
(18, 1, 'Darren', '2024-11-11 05:28:29', '00:01:13.000000', 'player1');

-- --------------------------------------------------------

--
-- Table structure for table `game_results`
--

CREATE TABLE `game_results` (
  `result_id` int(11) NOT NULL,
  `game_id` int(11) NOT NULL,
  `winner_token` varchar(255) NOT NULL,
  `player1_position` int(11) DEFAULT NULL,
  `player1_correct_answers` int(11) DEFAULT NULL,
  `player1_incorrect_answers` int(11) DEFAULT NULL,
  `player1_rolls` int(11) DEFAULT NULL,
  `player2_position` int(11) DEFAULT NULL,
  `player2_correct_answers` int(11) DEFAULT NULL,
  `player2_incorrect_answers` int(11) DEFAULT NULL,
  `player2_rolls` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `game_results`
--

INSERT INTO `game_results` (`result_id`, `game_id`, `winner_token`, `player1_position`, `player1_correct_answers`, `player1_incorrect_answers`, `player1_rolls`, `player2_position`, `player2_correct_answers`, `player2_incorrect_answers`, `player2_rolls`) VALUES
(1, 18, 'player1', 100, 4, 0, 16, 47, 1, 0, 12);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `user_email` varchar(100) NOT NULL,
  `user_password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_played` timestamp NULL DEFAULT NULL,
  `total_games_hosted` int(11) DEFAULT 0,
  `games_won_as_p1` int(11) DEFAULT 0,
  `games_won_as_p2` int(11) DEFAULT 0,
  `total_correct_answers` int(11) DEFAULT 0,
  `total_rolls` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `username`, `user_email`, `user_password`, `created_at`, `last_played`, `total_games_hosted`, `games_won_as_p1`, `games_won_as_p2`, `total_correct_answers`, `total_rolls`) VALUES
(1, 'Darren', 'chey@gmail.com', 'chey', '2024-11-10 21:28:05', '2024-11-10 21:29:42', 1, 1, 0, 5, 28);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `games`
--
ALTER TABLE `games`
  ADD PRIMARY KEY (`game_id`);

--
-- Indexes for table `game_results`
--
ALTER TABLE `game_results`
  ADD PRIMARY KEY (`result_id`),
  ADD KEY `fk_game_id` (`game_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `user_email` (`user_email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `games`
--
ALTER TABLE `games`
  MODIFY `game_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `game_results`
--
ALTER TABLE `game_results`
  MODIFY `result_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `game_results`
--
ALTER TABLE `game_results`
  ADD CONSTRAINT `fk_game_id` FOREIGN KEY (`game_id`) REFERENCES `games` (`game_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
