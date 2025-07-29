import React, { useEffect, useState } from 'react';

const VersionChecker = () => {
  const [versionInfo, setVersionInfo] = useState(null);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const checkVersion = () => {
      const scripts = Array.from(document.scripts);
      const mainScript = scripts.find(s => s.src.includes('main.') && s.src.includes('.js'));
      
      if (mainScript) {
        const match = mainScript.src.match(/main\.([a-f0-9]+)\.js/);
        if (match) {
          const currentHash = match[1];
          const brokenHash = 'f2fdf164'; // Hash causing clipboard error
          
          // Auto-detect if this is the latest build (not broken)
          const isLatestBuild = currentHash !== brokenHash;
          
          const info = {
            current: currentHash,
            isBroken: currentHash === brokenHash,
            isLatest: isLatestBuild,
            scriptSrc: mainScript.src
          };
          
          setVersionInfo(info);
          
          // Show warning if using broken version
          if (info.isBroken) {
            setShowWarning(true);
            console.error('🚨 USING BROKEN BUILD VERSION - CLIPBOARD WILL NOT WORK!');
            console.error('Current:', currentHash, 'Broken:', brokenHash);
          } else {
            console.log('✅ Using working build version:', currentHash);
          }
        }
      }
    };
    
    checkVersion();
  }, []);

  const clearCacheInstructions = () => {
    alert(`🚨 CACHE CLEAR REQUIRED!

You're using the OLD broken version that causes clipboard errors.

IMMEDIATE STEPS:
1. Press Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
2. Select "All time" and check ALL boxes
3. Click "Clear data"
4. Hard refresh with Ctrl+F5 (or Cmd+Shift+R)

Current version: ${versionInfo.current} (BROKEN)
Working versions: Any version except ${versionInfo.current}

The clipboard copy button will NOT work until you clear your cache!`);
  };

  if (!versionInfo) return null;

  // Show prominent warning for broken version
  if (showWarning && versionInfo.isBroken) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white p-4 shadow-lg animate-pulse">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <div className="font-bold text-lg">CRITICAL: Using Broken Build Version!</div>
              <div className="text-sm">
                Clipboard copy buttons will NOT work. Current: {versionInfo.current} (This is the broken version)
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={clearCacheInstructions}
              className="bg-white text-red-600 px-4 py-2 rounded font-bold hover:bg-gray-100"
            >
              🛠️ FIX NOW
            </button>
            <button
              onClick={() => setShowWarning(false)}
              className="bg-red-700 text-white px-3 py-2 rounded hover:bg-red-800"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show success for latest version - auto-hide after 5 seconds
  if (versionInfo.isLatest) {
    return (
      <div 
        className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg text-sm z-40 shadow-lg cursor-pointer flex items-center gap-2"
        onClick={() => setVersionInfo(null)}
        style={{ animation: 'fadeOut 5s forwards' }}
      >
        <span>✅ Latest build loaded - Clipboard fix active ({versionInfo.current})</span>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setVersionInfo(null);
          }}
          className="ml-2 text-green-200 hover:text-white font-bold"
        >
          ✕
        </button>
        <style jsx>{`
          @keyframes fadeOut {
            0% { opacity: 1; }
            85% { opacity: 1; }
            100% { opacity: 0; visibility: hidden; }
          }
        `}</style>
      </div>
    );
  }

  // Show info for unknown version - auto-hide after 3 seconds
  return (
    <div 
      className="fixed top-4 right-4 bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm z-40 shadow-lg cursor-pointer"
      onClick={() => setVersionInfo(null)}
      style={{ animation: 'fadeOut 3s forwards' }}
    >
Build Number: {versionInfo.current} (Click to dismiss)
      <style jsx>{`
        @keyframes fadeOut {
          0% { opacity: 1; }
          80% { opacity: 1; }
          100% { opacity: 0; visibility: hidden; }
        }
      `}</style>
    </div>
  );
};

export default VersionChecker;