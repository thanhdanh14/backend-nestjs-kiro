import Cookies from 'js-cookie';

export const setTokens = (accessToken: string, refreshToken: string) => {
  Cookies.set('access_token', accessToken, { expires: 1 }); // 1 day
  Cookies.set('refresh_token', refreshToken, { expires: 7 }); // 7 days
};

export const getAccessToken = () => {
  return Cookies.get('access_token');
};

export const getRefreshToken = () => {
  return Cookies.get('refresh_token');
};

export const removeTokens = () => {
  Cookies.remove('access_token');
  Cookies.remove('refresh_token');
};

export const isAuthenticated = () => {
  return !!getAccessToken();
};
