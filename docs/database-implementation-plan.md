# MySQL Database Migration Implementation Plan

## Overview
This document outlines the comprehensive plan to migrate the MonopolyTracker from localStorage to MySQL database storage, implementing proper backend architecture following SOLID principles and component-based design.

**🎯 Goal:** Implement robust, scalable data persistence with proper separation of concerns

---

## 🔍 Current System Analysis

### Current localStorage Implementation
- **Storage Method:** Browser localStorage with JSON serialization
- **Key:** `monopolyTrackerData`
- **Limitations:**
  - Browser-specific storage (no cross-device sync)
  - 5-10MB storage limit
  - No data integrity guarantees
  - No concurrent user support
  - Data loss on browser cache clear
  - No backup/recovery mechanism

### Data Structure Currently Stored
```javascript
{
  // Live Session Data
  sessionActive: boolean,
  sessionStartTime: ISO string,
  sessionEndTime: ISO string,
  results: array,
  resultTimestamps: array,
  startingCapital: number,
  currentCapital: number,
  baseBet: number,
  // ... other session fields
  
  // Session History (last 5 sessions only)
  sessionHistory: array
}
```

---

## 🗄️ Database Schema Design

### Tables Structure

#### 1. `users` Table
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  first_name VARCHAR(50) NOT NULL,
  middle_name VARCHAR(50) NULL,
  last_name VARCHAR(50) NOT NULL,
  initials VARCHAR(10) NOT NULL, -- Auto-generated: "J.R.A" format
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
```

#### 2. `sessions` Table
```sql
CREATE TABLE sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NULL,
  starting_capital DECIMAL(10,2) NOT NULL,
  final_capital DECIMAL(10,2) NULL,
  base_bet DECIMAL(10,2) NOT NULL,
  profit DECIMAL(10,2) DEFAULT 0,
  total_bets INT DEFAULT 0,
  successful_bets INT DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,
  highest_martingale INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_active (user_id, is_active),
  INDEX idx_start_time (start_time)
);
```

#### 3. `game_results` Table
```sql
CREATE TABLE game_results (
  id INT PRIMARY KEY AUTO_INCREMENT,
  session_id INT NOT NULL,
  user_id INT NOT NULL,
  result_value VARCHAR(20) NOT NULL, -- '1', '2', '5', '10', 'CHANCE', '2 ROLLS', '4 ROLLS'
  bet_amount DECIMAL(10,2) NULL,
  won BOOLEAN NULL,
  capital_after DECIMAL(10,2) NULL,
  martingale_level INT DEFAULT 0,
  is_multiplier BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_session_timestamp (session_id, timestamp),
  INDEX idx_user_timestamp (user_id, timestamp)
);
```

#### 4. `chance_events` Table
```sql
CREATE TABLE chance_events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  session_id INT NOT NULL,
  user_id INT NOT NULL,
  game_result_id INT NOT NULL,
  event_type ENUM('CASH_PRIZE', 'MULTIPLIER') NOT NULL,
  cash_amount DECIMAL(10,2) NULL,
  multiplier_value INT NULL,
  original_bet_amount DECIMAL(10,2) NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (game_result_id) REFERENCES game_results(id) ON DELETE CASCADE
);
```

---

## 🏗️ Backend Architecture (Node.js + Express)

### Project Structure
```
backend/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── environment.js
│   ├── controllers/
│   │   ├── AuthController.js
│   │   ├── SessionController.js
│   │   ├── GameResultController.js
│   │   └── UserController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── validationMiddleware.js
│   │   └── errorMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Session.js
│   │   ├── GameResult.js
│   │   └── ChanceEvent.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── sessions.js
│   │   ├── results.js
│   │   └── users.js
│   ├── services/
│   │   ├── AuthService.js
│   │   ├── SessionService.js
│   │   ├── GameResultService.js
│   │   └── DatabaseService.js
│   ├── utils/
│   │   ├── calculations.js
│   │   ├── validators.js
│   │   └── responses.js
│   └── app.js
├── package.json
└── server.js
```

### SOLID Principles Application

#### 1. Single Responsibility Principle (SRP)
- **Controllers:** Handle HTTP requests/responses only
- **Services:** Contain business logic
- **Models:** Handle data structure and basic validation
- **Middleware:** Handle cross-cutting concerns

#### 2. Open/Closed Principle (OCP)
- Service interfaces allow extension without modification
- Plugin-based architecture for calculations
- Strategy pattern for different betting systems

#### 3. Liskov Substitution Principle (LSP)
- All service implementations follow common interfaces
- Database adapters are interchangeable

#### 4. Interface Segregation Principle (ISP)
- Separate interfaces for different concerns
- Client-specific service contracts

#### 5. Dependency Inversion Principle (DIP)
- Services depend on abstractions, not concretions
- Dependency injection for database connections

### API Design (RESTful)

#### Authentication Endpoints
```
POST /api/auth/register          # Register new user with name fields
POST /api/auth/login            # Login with email/password
POST /api/auth/logout           # Logout and invalidate tokens
POST /api/auth/refresh-token    # Refresh JWT token
GET  /api/auth/me              # Get current user profile
POST /api/auth/verify-email    # Email verification (future feature)
```

#### Session Management Endpoints
```
GET    /api/sessions                    # Get user's sessions
POST   /api/sessions                    # Create new session
GET    /api/sessions/:id               # Get specific session
PUT    /api/sessions/:id               # Update session
DELETE /api/sessions/:id               # Delete session
GET    /api/sessions/active            # Get active session
PUT    /api/sessions/:id/end           # End session
```

#### Game Results Endpoints
```
GET    /api/sessions/:id/results       # Get session results
POST   /api/sessions/:id/results       # Add result to session
PUT    /api/results/:id                # Update specific result
DELETE /api/results/:id                # Delete result (undo)
GET    /api/results/recent             # Get recent results across sessions
```

#### User Data Endpoints
```
GET    /api/users/profile              # Get user profile
PUT    /api/users/profile              # Update user profile
GET    /api/users/statistics           # Get user statistics
GET    /api/users/export               # Export user data
DELETE /api/users/history              # Clear all user history
DELETE /api/users/sessions/:id         # Delete specific session
```

---

## 🔧 Frontend Modifications

### New Hooks Architecture

#### `useApi.js` - API Communication
```javascript
export const useApi = () => {
  const apiCall = async (endpoint, options) => {
    // Handle authentication, error handling, retry logic
  };
  
  return { apiCall, isLoading, error };
};
```

#### `useAuth.js` - Authentication Management
```javascript
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const login = async (credentials) => { /* */ };
  const logout = async () => { /* */ };
  const register = async (userData) => { /* */ };
  
  return { user, isAuthenticated, login, logout, register };
};
```

#### `useSessionData.js` - Session Data Management (Replaces useLocalStorage)
```javascript
export const useSessionData = () => {
  const { apiCall } = useApi();
  
  const loadSessionData = async () => { /* */ };
  const saveSessionData = async (data) => { /* */ };
  const syncData = async () => { /* */ };
  
  return { loadSessionData, saveSessionData, syncData };
};
```

#### `useRealTimeSync.js` - Real-time Data Synchronization
```javascript
export const useRealTimeSync = (sessionId) => {
  // WebSocket connection for real-time updates
  // Handle optimistic updates and conflict resolution
};
```

### Component Modifications

#### New Components Needed
```
src/components/
├── Auth/
│   ├── LoginForm.jsx              # Email/password login
│   ├── RegisterForm.jsx           # Registration with name fields
│   ├── AuthWrapper.jsx            # Authentication guard
│   ├── AuthLayout.jsx             # Layout for auth pages
│   └── ProtectedRoute.jsx         # Route protection component
├── Database/
│   ├── SyncStatus.jsx
│   ├── OfflineIndicator.jsx
│   └── DataExport.jsx
├── Common/
│   ├── LoadingSpinner.jsx
│   ├── ErrorBoundary.jsx
│   ├── Notification.jsx
│   └── ConfirmDialog.jsx          # For delete confirmations
└── History/
    ├── ClearAllHistoryButton.jsx  # Clear all history button
    └── DeleteSessionButton.jsx    # Delete individual session
```

#### Modified Existing Hooks
- `useSessionManagement.js`: Add API calls for session operations
- `useBettingLogic.js`: Add database persistence for each bet
- Remove `useLocalStorage.js` entirely

### State Management Evolution
```javascript
// Current localStorage state → Database-backed state with Authentication
const MonopolyTracker = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const { sessionData, syncStatus } = useSessionData();
  const { isOnline } = useNetworkStatus();
  
  // Redirect to login if not authenticated
  if (!loading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Prevent session creation if not authenticated
  const canCreateSession = isAuthenticated && user;
  
  // Add offline support
  const { queueAction, flushQueue } = useOfflineQueue();
  
  // Real-time synchronization
  useRealTimeSync(sessionData?.activeSession?.id);
  
  return (
    <AuthWrapper>
      {/* Main app content */}
    </AuthWrapper>
  );
};
```

---

## 🔐 Authentication & User Management

### User Registration Flow
1. **Registration Form Fields:**
   ```javascript
   {
     firstName: string (required),
     middleName: string (optional),
     lastName: string (required),
     email: string (required, unique),
     password: string (required, min 8 chars),
     confirmPassword: string (required, must match)
   }
   ```

2. **Initials Generation:**
   - Auto-generate on backend: `firstName[0] + middleName[0] + lastName[0]`
   - Format: "J.R.A" (dots, no spaces)
   - Handle missing middle name: "J.A" 

3. **Registration Validation:**
   - Email format validation
   - Password strength requirements
   - Duplicate email checking
   - Real-time form validation

### Authentication Flow
1. **Login Requirements:**
   - Email and password authentication
   - JWT token generation with refresh token
   - User session management

2. **Route Protection:**
   - All main app routes require authentication
   - Redirect to `/login` if not authenticated
   - Prevent session creation without valid user
   - Automatic token refresh

3. **Session Security:**
   - Only authenticated users can create live sessions
   - User sessions are tied to database user ID
   - Logout clears all tokens and redirects to login

### User Interface Updates
```javascript
// App.jsx routing structure
function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <MonopolyTracker />
          </ProtectedRoute>
        } />
        
        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
```

---

## 📊 Enhanced History Management

### Clear All History Feature
```javascript
// ClearAllHistoryButton.jsx
const ClearAllHistoryButton = ({ onClearAll }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  
  const handleClearAll = async () => {
    try {
      await api.delete('/api/users/history');
      onClearAll();
      showNotification('All history cleared successfully');
    } catch (error) {
      showNotification('Failed to clear history', 'error');
    }
  };
  
  return (
    <>
      <button 
        onClick={() => setShowConfirm(true)}
        className="btn-danger"
      >
        🗑️ Clear All History
      </button>
      
      <ConfirmDialog
        isOpen={showConfirm}
        title="Clear All History"
        message="Are you sure? This will permanently delete all your session history."
        onConfirm={handleClearAll}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
};
```

### Individual Session Deletion
```javascript
// DeleteSessionButton.jsx
const DeleteSessionButton = ({ sessionId, onDelete }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  
  const handleDelete = async () => {
    try {
      await api.delete(`/api/users/sessions/${sessionId}`);
      onDelete(sessionId);
      showNotification('Session deleted successfully');
    } catch (error) {
      showNotification('Failed to delete session', 'error');
    }
  };
  
  return (
    <>
      <button 
        onClick={() => setShowConfirm(true)}
        className="btn-sm btn-outline-danger"
        title="Delete this session"
      >
        🗑️
      </button>
      
      <ConfirmDialog
        isOpen={showConfirm}
        title="Delete Session"
        message="Are you sure you want to delete this session? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
};
```

### Updated History Component
```javascript
// History/index.js modifications
const History = ({ sessionHistory, onClose, onClearAll, onDeleteSession }) => {
  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header with Clear All button */}
      <div className="flex justify-between items-center p-6 border-b">
        <h2 className="text-xl font-bold text-gray-800">📊 Session History</h2>
        <div className="flex gap-2">
          <ClearAllHistoryButton onClearAll={onClearAll} />
          <button onClick={onClose}>×</button>
        </div>
      </div>

      {/* Sessions List with delete buttons */}
      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {sessionHistory.map((session) => (
          <div key={session.id} className="flex justify-between items-center">
            <SessionHistoryItem
              session={session}
              onClick={() => handleSessionClick(session)}
            />
            <DeleteSessionButton
              sessionId={session.id}
              onDelete={onDeleteSession}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## 🔒 Security Implementation

### Authentication & Authorization
- **JWT tokens** for stateless authentication
- **Refresh token rotation** for security
- **Role-based access control** (if multi-user features added)
- **Rate limiting** on API endpoints
- **CORS configuration** for frontend integration

### Data Security
- **Password hashing** with bcrypt (min 12 rounds)
- **SQL injection prevention** with parameterized queries
- **Input validation** and sanitization
- **HTTPS enforcement** in production
- **Environment variables** for sensitive configuration

### API Security
```javascript
// Example middleware stack
app.use(helmet()); // Security headers
app.use(cors(corsOptions));
app.use(rateLimit(rateLimitOptions));
app.use('/api', authMiddleware);
app.use('/api', validationMiddleware);
```

---

## 📊 Migration Strategy

### Phase 1: Backend Setup (Week 1)
1. **Database Setup**
   - Create MySQL database and tables
   - Set up connection pooling
   - Create initial seed data

2. **Core API Development**
   - Implement authentication system
   - Create basic CRUD operations
   - Set up middleware stack

3. **Testing Infrastructure**
   - Unit tests for services
   - Integration tests for API endpoints
   - Database migration scripts

### Phase 2: Data Migration (Week 2)
1. **Migration Script Development**
   - Parse existing localStorage data
   - Transform to database schema
   - Handle data validation and cleanup

2. **Dual Storage Period**
   - Run both localStorage and database in parallel
   - Validate data consistency
   - Gradual migration of users

3. **Migration Tools**
   - User data export utility
   - Batch migration scripts
   - Data integrity verification

### Phase 3: Frontend Integration (Week 3)
1. **Authentication UI**
   - Login/register forms
   - Session management
   - Error handling

2. **API Integration**
   - Replace localStorage hooks
   - Implement optimistic updates
   - Add loading states

3. **Offline Support**
   - Queue actions when offline
   - Sync when connection restored
   - Conflict resolution

### Phase 4: Production Deployment (Week 4)
1. **Performance Optimization**
   - Database indexing
   - API response caching
   - Connection pooling tuning

2. **Monitoring Setup**
   - Error tracking
   - Performance monitoring
   - Database health checks

3. **Backup Strategy**
   - Automated database backups
   - Point-in-time recovery
   - Disaster recovery plan

---

## 🛠️ Technical Dependencies

### Backend Dependencies
```json
{
  "express": "^4.18.0",
  "mysql2": "^3.6.0",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.0",
  "joi": "^17.9.0",
  "helmet": "^7.0.0",
  "cors": "^2.8.5",
  "dotenv": "^16.3.0",
  "express-rate-limit": "^6.8.0"
}
```

### Frontend Dependencies (Additional)
```json
{
  "axios": "^1.5.0",
  "react-query": "^3.39.0"
}
```

### Development Dependencies
```json
{
  "jest": "^29.6.0",
  "supertest": "^6.3.0",
  "nodemon": "^3.0.0"
}
```

---

## 📈 Performance Considerations

### Database Optimization
- **Indexing Strategy:**
  - Primary keys on all tables
  - Foreign key indexes
  - Composite indexes for common queries
  - Timestamp indexes for time-based queries

- **Query Optimization:**
  - Pagination for large result sets
  - Lazy loading for session details
  - Aggregate queries for statistics
  - Connection pooling (5-10 connections)

### API Performance
- **Caching Strategy:**
  - Redis for session caching
  - HTTP caching headers
  - Query result caching
  - Static asset caching

- **Response Optimization:**
  - Gzip compression
  - JSON response minification
  - Partial data loading
  - Background data sync

### Frontend Performance
- **State Management:**
  - React Query for server state
  - Optimistic updates
  - Background refetching
  - Error boundary implementation

---

## 🧪 Testing Strategy

### Backend Testing
1. **Unit Tests**
   - Service layer logic
   - Utility functions
   - Model validations

2. **Integration Tests**
   - API endpoint testing
   - Database operations
   - Authentication flows

3. **End-to-End Tests**
   - Complete user journeys
   - Data migration testing
   - Performance testing

### Frontend Testing
1. **Component Tests**
   - Authentication components
   - Data display components
   - Form validations

2. **Hook Tests**
   - API integration hooks
   - State management hooks
   - Error handling

3. **Integration Tests**
   - Login/logout flows
   - Session management
   - Offline/online transitions

---

## 🚀 Deployment Architecture

### Production Environment
```
Load Balancer (nginx)
    ↓
API Server (Node.js + Express)
    ↓
Database (MySQL 8.0)
    ↓
Redis Cache
```

### Environment Configuration
- **Development:** Local MySQL, no authentication
- **Staging:** Replicated production setup
- **Production:** Managed MySQL, SSL, monitoring

---

## 📋 Implementation Checklist

### Pre-Implementation
- [ ] Review and approve this plan
- [ ] Set up development environment
- [ ] Create project repositories
- [ ] Design database schema review

### Phase 1: Backend
- [ ] MySQL database setup
- [ ] Express server scaffolding
- [ ] Authentication system
- [ ] Basic CRUD operations
- [ ] API documentation

### Phase 2: Migration
- [ ] Data migration scripts
- [ ] Validation tools
- [ ] Backup procedures
- [ ] Testing migration process

### Phase 3: Frontend
- [ ] Authentication UI
- [ ] API integration
- [ ] State management updates
- [ ] Offline support

### Phase 4: Production
- [ ] Performance optimization
- [ ] Security audit
- [ ] Monitoring setup
- [ ] Deployment scripts

---

## 🔄 Rollback Strategy

### Immediate Rollback (if critical issues)
1. Switch frontend back to localStorage
2. Disable database writes
3. Maintain read-only database access
4. Fix issues in staging environment

### Data Recovery
1. Export database data to JSON
2. Convert back to localStorage format
3. Provide manual import tool
4. Maintain data integrity checks

---

## 📊 Success Metrics

### Technical Metrics
- **Performance:** < 200ms API response time
- **Availability:** 99.9% uptime
- **Data Integrity:** 0% data loss during migration
- **Security:** 0 security vulnerabilities

### User Experience Metrics
- **Migration Success:** 100% successful data migrations
- **Performance:** Page load time < 2 seconds
- **Reliability:** < 1% error rate
- **Offline Support:** Queue 100% of offline actions

---

## 🤝 Team Coordination

### Roles & Responsibilities
- **Backend Developer:** API development, database design
- **Frontend Developer:** UI updates, state management
- **DevOps:** Deployment, monitoring, infrastructure
- **QA:** Testing, validation, user acceptance

### Communication Plan
- Daily standups during implementation
- Weekly architecture reviews
- Code reviews for all changes
- Documentation updates throughout

---

This implementation plan provides a comprehensive roadmap for migrating from localStorage to MySQL while maintaining code quality, following SOLID principles, and ensuring a smooth user experience. The phased approach allows for careful validation at each step and provides rollback options if issues arise. 

### Backend Services Updates

#### AuthService.js
```javascript
class AuthService {
  async register(userData) {
    const { firstName, middleName, lastName, email, password } = userData;
    
    // Generate initials
    const initials = this.generateInitials(firstName, middleName, lastName);
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Create user
    const user = await User.create({
      firstName,
      middleName,
      lastName,
      initials,
      email,
      passwordHash
    });
    
    return this.generateTokens(user);
  }
  
  generateInitials(firstName, middleName, lastName) {
    const initials = [
      firstName[0].toUpperCase(),
      middleName ? middleName[0].toUpperCase() : null,
      lastName[0].toUpperCase()
    ].filter(Boolean).join('.');
    
    return initials;
  }
  
  async login(email, password) {
    const user = await User.findByEmail(email);
    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      throw new Error('Invalid credentials');
    }
    
    // Update last login
    await User.updateLastLogin(user.id);
    
    return this.generateTokens(user);
  }
}
```

#### SessionService.js Updates
```javascript
class SessionService {
  async createSession(userId, sessionData) {
    // Verify user is authenticated
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    return await Session.create({ userId, ...sessionData });
  }
  
  async deleteUserHistory(userId) {
    // Delete all sessions and related data for user
    await GameResult.deleteByUserId(userId);
    await ChanceEvent.deleteByUserId(userId);
    await Session.deleteByUserId(userId);
  }
  
  async deleteSession(userId, sessionId) {
    // Verify session belongs to user
    const session = await Session.findById(sessionId);
    if (!session || session.userId !== userId) {
      throw new Error('Session not found or access denied');
    }
    
    await Session.deleteById(sessionId);
  }
}
```

#### Authentication Middleware
```javascript
// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid token or user inactive.' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

module.exports = authMiddleware;
``` 