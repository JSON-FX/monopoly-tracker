-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS db_monopoly_tracker;
USE db_monopoly_tracker;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  middle_name VARCHAR(50),
  last_name VARCHAR(50) NOT NULL,
  initials VARCHAR(10) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,
  
  INDEX idx_users_email (email),
  INDEX idx_users_active (is_active)
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP NULL,
  starting_capital DECIMAL(10,2) NOT NULL,
  current_capital DECIMAL(10,2) NOT NULL,
  final_capital DECIMAL(10,2) DEFAULT 0,
  base_bet DECIMAL(10,2) NOT NULL,
  profit DECIMAL(10,2) DEFAULT 0,
  total_bets INT DEFAULT 0,
  successful_bets INT DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,
  highest_martingale DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  session_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sessions_user (user_id),
  INDEX idx_sessions_active (is_active),
  INDEX idx_sessions_start_time (start_time)
);

-- Game results table
CREATE TABLE IF NOT EXISTS game_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  user_id INT NOT NULL,
  result_value VARCHAR(20) NOT NULL,
  bet_amount DECIMAL(10,2),
  won BOOLEAN DEFAULT FALSE,
  capital_after DECIMAL(10,2),
  martingale_level INT DEFAULT 0,
  is_multiplier BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_game_results_session (session_id),
  INDEX idx_game_results_user (user_id),
  INDEX idx_game_results_timestamp (timestamp)
);

-- Chance events table
CREATE TABLE IF NOT EXISTS chance_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  user_id INT NOT NULL,
  game_result_id INT,
  event_type ENUM('CASH_PRIZE', 'MULTIPLIER') NOT NULL,
  cash_amount DECIMAL(10,2),
  multiplier_value DECIMAL(4,2),
  original_bet_amount DECIMAL(10,2),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (game_result_id) REFERENCES game_results(id) ON DELETE CASCADE,
  INDEX idx_chance_events_session (session_id),
  INDEX idx_chance_events_user (user_id),
  INDEX idx_chance_events_game_result (game_result_id),
  INDEX idx_chance_events_timestamp (timestamp)
); 