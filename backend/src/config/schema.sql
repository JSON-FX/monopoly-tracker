-- MonopolyTracker Database Schema for Authentication
-- Run this script to create the database and tables

USE db_monopoly_tracker;

-- Users table with name fields and initials
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  first_name VARCHAR(50) NOT NULL,
  middle_name VARCHAR(50) NULL,
  last_name VARCHAR(50) NOT NULL,
  initials VARCHAR(10) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP NULL,
  
  INDEX idx_email (email),
  INDEX idx_initials (initials),
  INDEX idx_active (is_active)
);

-- Sessions table for game sessions
CREATE TABLE IF NOT EXISTS sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NULL,
  starting_capital DECIMAL(10,2) NOT NULL,
  ending_capital DECIMAL(10,2) NULL,
  current_capital DECIMAL(10,2) NOT NULL,
  base_bet DECIMAL(10,2) NOT NULL,
  total_spins INT DEFAULT 0,
  total_winnings DECIMAL(10,2) DEFAULT 0,
  total_losses DECIMAL(10,2) DEFAULT 0,
  session_notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_start_time (start_time),
  INDEX idx_active (is_active)
);

-- Game results table for individual spin results
CREATE TABLE IF NOT EXISTS game_results (
  id INT PRIMARY KEY AUTO_INCREMENT,
  session_id INT NOT NULL,
  result_type ENUM('1', '2', '5', '10', 'CHANCE') NOT NULL,
  result_timestamp TIMESTAMP NOT NULL,
  bet_amount DECIMAL(10,2) NOT NULL,
  win_amount DECIMAL(10,2) DEFAULT 0,
  capital_after DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  INDEX idx_session_id (session_id),
  INDEX idx_result_type (result_type),
  INDEX idx_result_timestamp (result_timestamp)
);

-- Chance events table for bonus round tracking
CREATE TABLE IF NOT EXISTS chance_events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  game_result_id INT NOT NULL,
  event_type ENUM('CASH_PRIZE', 'MULTIPLIER') NOT NULL,
  cash_amount DECIMAL(10,2) NULL,
  multiplier_value DECIMAL(4,2) NULL,
  multiplier_hits INT NULL,
  total_win DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (game_result_id) REFERENCES game_results(id) ON DELETE CASCADE,
  INDEX idx_game_result_id (game_result_id),
  INDEX idx_event_type (event_type)
); 