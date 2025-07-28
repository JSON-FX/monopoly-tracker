import React from 'react';

const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'danger' // 'danger', 'warning', 'info'
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          titleColor: 'text-red-600',
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
          icon: '⚠️'
        };
      case 'warning':
        return {
          titleColor: 'text-yellow-600',
          confirmButton: 'bg-yellow-600 hover:bg-yellow-700 text-white',
          icon: '⚠️'
        };
      case 'info':
        return {
          titleColor: 'text-blue-600',
          confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
          icon: 'ℹ️'
        };
      default:
        return {
          titleColor: 'text-gray-600',
          confirmButton: 'bg-gray-600 hover:bg-gray-700 text-white',
          icon: '❓'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{styles.icon}</span>
            <h3 className={`text-lg font-semibold ${styles.titleColor}`}>
              {title}
            </h3>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 text-sm leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${styles.confirmButton} focus:ring-red-500`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog; 