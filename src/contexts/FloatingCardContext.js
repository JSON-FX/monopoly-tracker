import React, { createContext, useContext, useState, useEffect } from 'react';

const FloatingCardContext = createContext();

export const FloatingCardProvider = ({ children }) => {
  const [isVisible, setIsVisible] = useState(() => {
    // Get initial state from localStorage or default to true
    const stored = localStorage.getItem('floatingCardVisible');
    return stored !== null ? JSON.parse(stored) : true;
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('floatingCardVisible', JSON.stringify(isVisible));
  }, [isVisible]);

  const toggleVisibility = () => {
    setIsVisible(prev => !prev);
  };

  const value = {
    isVisible,
    toggleVisibility
  };

  return (
    <FloatingCardContext.Provider value={value}>
      {children}
    </FloatingCardContext.Provider>
  );
};

export const useFloatingCard = () => {
  const context = useContext(FloatingCardContext);
  if (!context) {
    throw new Error('useFloatingCard must be used within a FloatingCardProvider');
  }
  return context;
}; 