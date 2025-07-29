import React, { useState, useEffect, useCallback } from 'react';

const DebugConsole = ({ isVisible, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [buildInfo, setBuildInfo] = useState('Checking...');

  const addLog = useCallback((message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const newLog = {
      id: Date.now() + Math.random(),
      timestamp,
      message,
      type
    };
    setLogs(prev => [...prev, newLog]);
  }, []);

  const clearLogs = () => setLogs([]);

  const checkClipboardAPI = useCallback(() => {
    addLog('🧪 Starting clipboard diagnostics...', 'info');
    
    // Basic checks
    addLog(`Navigator exists: ${typeof navigator !== 'undefined'}`, 'info');
    addLog(`Navigator.clipboard exists: ${!!navigator?.clipboard}`, 'info');
    addLog(`WriteText function exists: ${typeof navigator?.clipboard?.writeText === 'function'}`, 'info');
    addLog(`Is secure context: ${window.isSecureContext}`, 'info');
    addLog(`Protocol: ${window.location.protocol}`, 'info');

    // Ultra-defensive check (same as RecentResultsWithSkip)
    const hasClipboardAPI = (
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      navigator &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function'
    );
    
    addLog(`Ultra-defensive check: ${hasClipboardAPI}`, hasClipboardAPI ? 'success' : 'error');

    // Test actual clipboard
    if (hasClipboardAPI) {
      navigator.clipboard.writeText('DEBUG_TEST_' + Date.now())
        .then(() => addLog('✅ Clipboard write successful!', 'success'))
        .catch(err => addLog(`❌ Clipboard error: ${err.message}`, 'error'));
    } else {
      addLog('⚠️ Using fallback method test...', 'warning');
      testFallback();
    }
  }, [addLog]);

  const testFallback = useCallback(() => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = 'FALLBACK_TEST_' + Date.now();
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      addLog(`Fallback result: ${successful}`, successful ? 'success' : 'error');
    } catch (err) {
      addLog(`Fallback error: ${err.message}`, 'error');
    }
  }, [addLog]);

  const simulateRecentResultsError = useCallback(() => {
    addLog('🎭 Simulating RecentResultsWithSkip error...', 'warning');
    
    try {
      // This is the exact code that was failing
      const mockResults = ['1', '2', '5'];
      const mockResultSkipInfo = [{}, {}, {}];
      
      if (!mockResults || mockResults.length === 0) {
        addLog('Early return triggered', 'info');
        return;
      }

      const enhancedResults = mockResults.map((result, index) => {
        const skipInfo = mockResultSkipInfo[index];
        if (skipInfo?.isSkipped) {
          return `${result}(Skipped: ${skipInfo.skipReason || 'Unknown'})`;
        }
        return result;
      });

      const copyText = enhancedResults.join(',');
      addLog(`Copy text generated: ${copyText}`, 'info');
      
      // The problematic line that was causing the error
      const hasClipboardAPI = (
        typeof window !== 'undefined' &&
        typeof navigator !== 'undefined' &&
        navigator &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === 'function'
      );
      
      if (hasClipboardAPI) {
        addLog('✅ Would use modern clipboard API', 'success');
        navigator.clipboard.writeText(copyText)
          .then(() => addLog('✅ Simulation successful', 'success'))
          .catch(err => addLog(`❌ Simulation failed: ${err.message}`, 'error'));
      } else {
        addLog('⚠️ Would use fallback (correct behavior)', 'warning');
      }
      
    } catch (error) {
      addLog(`🚨 Simulation caught error: ${error.message}`, 'error');
    }
  }, [addLog]);

  const checkBuildVersion = useCallback(() => {
    addLog('📦 Checking build version...', 'info');
    
    const scripts = Array.from(document.scripts);
    const mainScript = scripts.find(s => s.src.includes('main.') && s.src.includes('.js'));
    
    if (mainScript) {
      const match = mainScript.src.match(/main\.([a-f0-9]+)\.js/);
      if (match) {
        const currentHash = match[1];
        addLog(`Current build hash: ${currentHash}`, 'info');
        
        // Check against expected hashes
        const expectedHash = '7b53706f'; // Latest build
        const oldHash = 'f2fdf164'; // Hash from error
        
        if (currentHash === expectedHash) {
          addLog('✅ Using latest build!', 'success');
          setBuildInfo('✅ Latest build loaded');
        } else if (currentHash === oldHash) {
          addLog('❌ Using OLD cached build - this is the problem!', 'error');
          setBuildInfo('❌ Old cached build detected');
        } else {
          addLog(`⚠️ Unknown build hash: ${currentHash}`, 'warning');
          setBuildInfo(`Unknown build: ${currentHash}`);
        }
      }
    } else {
      addLog('❌ Could not find main build script', 'error');
      setBuildInfo('❌ No build script found');
    }
  }, [addLog]);

  useEffect(() => {
    if (isVisible) {
      addLog('🚀 Debug console activated', 'success');
      checkBuildVersion();
      
      // Set up error monitoring
      const errorHandler = (event) => {
        if (event.message?.includes('clipboard') || event.message?.includes('writeText')) {
          addLog(`🚨 CLIPBOARD ERROR: ${event.message}`, 'error');
          addLog(`File: ${event.filename}:${event.lineno}`, 'error');
        }
      };
      
      window.addEventListener('error', errorHandler);
      return () => window.removeEventListener('error', errorHandler);
    }
  }, [isVisible, addLog, checkBuildVersion]);

  if (!isVisible) return null;

  const getLogColor = (type) => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'success': return 'text-green-400';
      default: return 'text-blue-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 text-green-400 font-mono text-sm border-2 border-green-500 rounded-lg w-full max-w-4xl h-3/4 flex flex-col">
        {/* Header */}
        <div className="bg-green-500 text-black p-3 rounded-t-lg flex justify-between items-center">
          <h2 className="font-bold">🐛 CLIPBOARD DEBUG CONSOLE</h2>
          <button 
            onClick={onClose}
            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
          >
            ✕ Close
          </button>
        </div>

        {/* Build Info */}
        <div className="bg-gray-800 p-3 border-b border-gray-700">
          <div className="text-yellow-400 font-bold">📦 Build Status: {buildInfo}</div>
        </div>

        {/* Controls */}
        <div className="bg-gray-800 p-3 border-b border-gray-700 flex flex-wrap gap-2">
          <button 
            onClick={checkClipboardAPI}
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            🧪 Test Clipboard
          </button>
          <button 
            onClick={simulateRecentResultsError}
            className="bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700"
          >
            🎭 Simulate Error
          </button>
          <button 
            onClick={checkBuildVersion}
            className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
          >
            📦 Check Build
          </button>
          <button 
            onClick={clearLogs}
            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
          >
            🗑️ Clear
          </button>
        </div>

        {/* Logs */}
        <div className="flex-1 p-4 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-gray-500">No logs yet. Click a button above to start debugging.</div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="mb-2">
                <span className="text-gray-500 text-xs">[{log.timestamp}]</span>{' '}
                <span className={getLogColor(log.type)}>{log.message}</span>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-800 p-2 rounded-b-lg text-xs text-gray-400">
          Debug Console v1.0 | Error tracking: navigator.clipboard.writeText undefined
        </div>
      </div>
    </div>
  );
};

export default DebugConsole;