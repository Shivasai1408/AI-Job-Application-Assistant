// ===== Authentication Helper Functions =====

function setAuthData(token, user) {
  localStorage.setItem('access_token', token);
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    localStorage.removeItem('user');
  }
}

function getToken() {
  return localStorage.getItem('access_token');
}

function getUser() {
  try {
    const u = localStorage.getItem('user');
    if (!u || u === 'undefined' || u === 'null') return null;
    return JSON.parse(u);
  } catch (e) {
    localStorage.removeItem('user');
    return null;
  }
}

function isAuthenticated() {
  return !!getToken();
}

function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
  window.location.hash = '#login';
  window.location.reload();
}
