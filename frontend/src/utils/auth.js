export const getToken = () => {
  return localStorage.getItem('constructora_token');
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('constructora_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
};

export const setAuthData = (token, user) => {
  localStorage.setItem('constructora_token', token);
  localStorage.setItem('constructora_user', JSON.stringify(user));
};

export const clearAuthData = () => {
  localStorage.removeItem('constructora_token');
  localStorage.removeItem('constructora_user');
};

export const authFetch = async (url, options = {}) => {
  const token = getToken();
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(url, config);

  if (response.status === 401) {
    clearAuthData();
    window.location.reload();
  }

  return response;
};
