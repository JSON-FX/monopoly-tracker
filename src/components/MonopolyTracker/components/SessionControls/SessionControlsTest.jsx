import React, { useState } from 'react';
import SessionControls from './SessionControls';

/**
 * Test component to verify SessionControls works in isolation
 * This helps us verify the component independently before integration
 */
const SessionControlsTest = () => {
  const [sessionActive, setSessionActive] = useState(false);
  const [isTargetAchieved, setIsTargetAchieved] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleStartSession = () => {
    addLog('✅ START SESSION CALLED');
    setSessionActive(true);
    alert('Session started!');
  };

  const handleEndSession = () => {
    addLog('✅ END SESSION CALLED');
    if (window.confirm('End session?')) {
      setSessionActive(false);
      setIsTargetAchieved(false);
      alert('Session ended!');
    }
  };

  const handleClearSession = () => {
    addLog('✅ CLEAR SESSION CALLED');
    if (window.confirm('Clear session?')) {
      setSessionActive(false);
      setIsTargetAchieved(false);
      alert('Session cleared!');
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">SessionControls Test</h2>
      
      {/* Controls */}
      <div className="mb-4 space-y-2">
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={sessionActive}
              onChange={(e) => setSessionActive(e.target.checked)}
              className="mr-2"
            />
            Session Active
          </label>
        </div>
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isTargetAchieved}
              onChange={(e) => setIsTargetAchieved(e.target.checked)}
              className="mr-2"
              disabled={!sessionActive}
            />
            Target Achieved
          </label>
        </div>
      </div>

      {/* SessionControls Component */}
      <div className="mb-4 p-4 border-2 border-blue-200 rounded-lg">
        <h3 className="text-sm font-semibold mb-2">SessionControls Component:</h3>
        <SessionControls
          sessionActive={sessionActive}
          isTargetAchieved={isTargetAchieved}
          onStartSession={handleStartSession}
          onEndSession={handleEndSession}
          onClearSession={handleClearSession}
        />
      </div>

      {/* Logs */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-2">Event Logs:</h3>
        <div className="h-32 overflow-y-auto bg-gray-100 p-2 rounded text-xs">
          {logs.length === 0 ? (
            <div className="text-gray-500">No events yet...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">{log}</div>
            ))
          )}
        </div>
        <button
          onClick={() => setLogs([])}
          className="mt-2 px-2 py-1 bg-gray-300 text-xs rounded"
        >
          Clear Logs
        </button>
      </div>

      {/* Current State */}
      <div className="text-xs text-gray-600">
        <div>Session Active: {sessionActive ? 'Yes' : 'No'}</div>
        <div>Target Achieved: {isTargetAchieved ? 'Yes' : 'No'}</div>
      </div>
    </div>
  );
};

export default SessionControlsTest; 