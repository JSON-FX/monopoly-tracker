# Database Integration Documentation

## Current Database Integration Patterns (feature/jsonse/authentication branch)

### Key Database-Related Files:
1. **Backend Integration:**
   - `backend/` - Full MySQL backend with authentication and session management
   - `backend/src/config/database.js` - Database configuration
   - `backend/src/models/` - Database models (User, Session, GameResult, ChanceEvent)
   - `backend/src/controllers/` - API controllers
   - `backend/src/routes/` - API routes

2. **Frontend Database Integration:**
   - `src/hooks/useSessionData.js` - Main hook for database operations
   - `src/hooks/useAuth.js` - Authentication with database
   - `src/services/AuthService.js` - Authentication API calls

### Database Operations in MonopolyTracker:
- **Session Management:** Database-based session creation, ending, archiving
- **Result Tracking:** All results saved to database instead of localStorage
- **User Authentication:** Full user system with login/register
- **History:** Session history loaded from database

### Key Integration Points:
1. **useSessionData Hook:**
   ```javascript
   const {
     createSession,
     endSession, 
     addResult,
     updateSession,
     loadSessionHistory
   } = useSessionData();
   ```

2. **Database API Calls:**
   - Create session: `POST /api/sessions`
   - Add result: `POST /api/sessions/:id/results`
   - End session: `PUT /api/sessions/:id/end`
   - Load history: `GET /api/sessions`

3. **Authentication Integration:**
   - Protected routes using JWT tokens
   - User-specific session data
   - Login/logout functionality

### Components with Database Dependencies:
- `MonopolyTracker.js` - Main component using database operations
- `History/index.js` - Loads session history from database
- All session management components

### Database Schema:
- **users** - User authentication and profile data
- **sessions** - Gaming session data with user association
- **game_results** - Individual spin results linked to sessions
- **chance_events** - Special chance event tracking

### Data Flow:
1. User authenticates → JWT token stored
2. Create session → Database session record
3. Add results → Database game_results records
4. View history → Load from database sessions
5. End session → Update database session with final stats

### Important: Keep This Integration
- **DO NOT remove database operations**
- **DO NOT restore localStorage**
- **Keep useSessionData.js**
- **Keep all backend files**
- **Only change UI/UX, not data persistence** 