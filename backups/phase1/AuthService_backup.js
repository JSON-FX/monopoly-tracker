  /**
   * Generate user initials from name components
   * @param {string} firstName 
   * @param {string} middleName 
   * @param {string} lastName 
   * @returns {string} Generated initials
   */
  generateInitials(firstName, middleName, lastName) {
    const initials = [
      firstName ? firstName[0].toUpperCase() : '',
      middleName ? middleName[0].toUpperCase() : '',
      lastName ? lastName[0].toUpperCase() : ''
    ].filter(Boolean).join('.');

    return initials;
  }
}

module.exports = AuthService; 