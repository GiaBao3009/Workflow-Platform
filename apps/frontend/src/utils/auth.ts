/**
 * Get authentication token from localStorage
 * Checks both 'auth_token' and 'token' keys for backward compatibility
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token') || localStorage.getItem('token');
};

/**
 * Create authorization headers for API requests
 */
export const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};
