import React, { useState, useEffect } from 'react';

const Notification = ({
  message,
  type = 'info', // 'success', 'error', 'warning', 'info'
  duration = 4000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose && onClose(), 300); // Wait for fade animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bgColor: 'bg-green-50 border-green-200',
          textColor: 'text-green-800',
          icon: '✅',
          iconColor: 'text-green-500'
        };
      case 'error':
        return {
          bgColor: 'bg-red-50 border-red-200',
          textColor: 'text-red-800',
          icon: '❌',
          iconColor: 'text-red-500'
        };
      case 'warning':
        return {
          bgColor: 'bg-yellow-50 border-yellow-200',
          textColor: 'text-yellow-800',
          icon: '⚠️',
          iconColor: 'text-yellow-500'
        };
      case 'info':
      default:
        return {
          bgColor: 'bg-blue-50 border-blue-200',
          textColor: 'text-blue-800',
          icon: 'ℹ️',
          iconColor: 'text-blue-500'
        };
    }
  };

  const styles = getTypeStyles();

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose && onClose(), 300);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
      <div className={`flex items-center p-4 rounded-lg border shadow-lg ${styles.bgColor}`}>
        <span className={`text-xl mr-3 ${styles.iconColor}`}>
          {styles.icon}
        </span>
        <p className={`text-sm font-medium ${styles.textColor} flex-1`}>
          {message}
        </p>
        <button
          onClick={handleClose}
          className={`ml-3 ${styles.textColor} hover:opacity-70 transition-opacity`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Notification provider for managing multiple notifications
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = (message, type = 'info', duration = 4000) => {
    const id = Date.now();
    const notification = { id, message, type, duration };
    
    setNotifications(prev => [...prev, notification]);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Expose showNotification globally
  React.useEffect(() => {
    window.showNotification = showNotification;
    return () => {
      delete window.showNotification;
    };
  }, []);

  return (
    <>
      {children}
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          duration={notification.duration}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </>
  );
};

export default Notification; 