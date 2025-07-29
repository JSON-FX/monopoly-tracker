import React from 'react';

/**
 * SessionControls Component
 * Handles session start, end, and clear actions
 * Follows Single Responsibility Principle - only manages session control actions
 */
const SessionControls = ({
  sessionActive,
  isTargetAchieved,
  onStartSession,
  onEndSession,
  onClearSession
}) => {
  // Verify functions are properly passed
  if (typeof onStartSession !== 'function') {
    console.error('SessionControls: onStartSession is not a function');
    return <div>Error: Missing start session handler</div>;
  }
  
  if (typeof onEndSession !== 'function') {
    console.error('SessionControls: onEndSession is not a function');
    return <div>Error: Missing end session handler</div>;
  }
  
  if (typeof onClearSession !== 'function') {
    console.error('SessionControls: onClearSession is not a function');
    return <div>Error: Missing clear session handler</div>;
  }

  // Handle start session with error boundary
  const handleStartSession = (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      console.log('🎯 SessionControls: Starting session...');
      console.log('🎯 onStartSession type:', typeof onStartSession);
      onStartSession();
      console.log('🎯 onStartSession called successfully');
    } catch (error) {
      console.error('Error starting session:', error);
      alert('❌ Failed to start session. Please try again.');
    }
  };

  // Handle end session with error boundary
  const handleEndSession = (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      console.log('🎯 SessionControls: Ending session...');
      console.log('🎯 onEndSession type:', typeof onEndSession);
      onEndSession();
      console.log('🎯 onEndSession called successfully');
    } catch (error) {
      console.error('Error ending session:', error);
      alert('❌ Failed to end session. Please try again.');
    }
  };

  // Handle clear session with error boundary
  const handleClearSession = (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      console.log('🎯 SessionControls: Clearing session...');
      console.log('🎯 onClearSession type:', typeof onClearSession);
      onClearSession();
      console.log('🎯 onClearSession called successfully');
    } catch (error) {
      console.error('Error clearing session:', error);
      alert('❌ Failed to clear session. Please try again.');
    }
  };

  if (!sessionActive) {
    return (
      <button
        onClick={handleStartSession}
        className="w-full h-8 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded transition-colors jackpot-glow"
        type="button"
      >
        💰 Start Session
      </button>
    );
  }

  return (
    <div className="flex gap-1">
      <button
        onClick={handleEndSession}
        type="button"
        className={`flex-1 h-8 text-white text-xs font-bold rounded transition-colors ${
          isTargetAchieved 
            ? 'bg-yellow-600 hover:bg-yellow-700 jackpot-glow' 
            : 'bg-orange-600 hover:bg-orange-700'
        }`}
      >
        {isTargetAchieved ? 'End Session' : '⏹️ End'}
      </button>
      {!isTargetAchieved && (
        <button
          onClick={handleClearSession}
          type="button"
          className="flex-1 h-8 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded transition-colors"
        >
          🗑️ Clear
        </button>
      )}
    </div>
  );
};

export default SessionControls; 