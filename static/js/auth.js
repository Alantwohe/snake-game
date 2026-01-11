/**
 * Authentication JavaScript for Snake Game
 */

const API_BASE = '';

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', () => {
      const token = localStorage.getItem('token');
      if (token) {
            // Verify token is still valid
            verifyToken(token);
      }
});

/**
 * Verify if stored token is still valid
 */
async function verifyToken(token) {
      try {
            const response = await fetch(`${API_BASE}/api/users/me`, {
                  headers: {
                        'Authorization': `Bearer ${token}`
                  }
            });
            if (response.ok) {
                  // Token is valid, redirect to game
                  window.location.href = '/game';
            } else {
                  // Token is invalid, clear it
                  localStorage.removeItem('token');
                  localStorage.removeItem('username');
            }
      } catch (error) {
            console.error('Token verification failed:', error);
      }
}

/**
 * Switch between login and register tabs
 */
function switchTab(tab) {
      const loginPanel = document.getElementById('loginPanel');
      const registerPanel = document.getElementById('registerPanel');
      const tabBtns = document.querySelectorAll('.tab-btn');
      const message = document.getElementById('message');

      // Clear message
      message.className = 'message';
      message.textContent = '';

      // Switch panels
      if (tab === 'login') {
            loginPanel.classList.add('active');
            registerPanel.classList.remove('active');
            tabBtns[0].classList.add('active');
            tabBtns[1].classList.remove('active');
      } else {
            registerPanel.classList.add('active');
            loginPanel.classList.remove('active');
            tabBtns[1].classList.add('active');
            tabBtns[0].classList.remove('active');
      }
}

/**
 * Show message to user
 */
function showMessage(text, type) {
      const message = document.getElementById('message');
      message.textContent = text;
      message.className = `message ${type}`;
}

/**
 * Handle login form submission
 */
async function handleLogin(event) {
      event.preventDefault();

      const username = document.getElementById('loginUsername').value.trim();
      const password = document.getElementById('loginPassword').value;
      const loginBtn = document.getElementById('loginBtn');

      if (!username || !password) {
            showMessage('请填写所有字段', 'error');
            return;
      }

      loginBtn.disabled = true;
      loginBtn.textContent = '登录中...';

      try {
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            const response = await fetch(`${API_BASE}/api/users/login`, {
                  method: 'POST',
                  headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                  },
                  body: formData
            });

            const data = await response.json();

            if (response.ok) {
                  // Store token and username
                  localStorage.setItem('token', data.access_token);
                  localStorage.setItem('username', data.username);

                  showMessage('登录成功！正在跳转...', 'success');

                  // Redirect to game page
                  setTimeout(() => {
                        window.location.href = '/game';
                  }, 1000);
            } else {
                  showMessage(data.detail || '登录失败，请检查用户名和密码', 'error');
            }
      } catch (error) {
            console.error('Login error:', error);
            showMessage('网络错误，请稍后重试', 'error');
      } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = '登录';
      }
}

/**
 * Handle register form submission
 */
async function handleRegister(event) {
      event.preventDefault();

      const username = document.getElementById('registerUsername').value.trim();
      const password = document.getElementById('registerPassword').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const registerBtn = document.getElementById('registerBtn');

      if (!username || !password || !confirmPassword) {
            showMessage('请填写所有字段', 'error');
            return;
      }

      if (username.length < 3) {
            showMessage('用户名至少需要3个字符', 'error');
            return;
      }

      if (password.length < 6) {
            showMessage('密码至少需要6个字符', 'error');
            return;
      }

      if (password !== confirmPassword) {
            showMessage('两次输入的密码不一致', 'error');
            return;
      }

      registerBtn.disabled = true;
      registerBtn.textContent = '注册中...';

      try {
            const response = await fetch(`${API_BASE}/api/users/register`, {
                  method: 'POST',
                  headers: {
                        'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                  showMessage('注册成功！请登录', 'success');

                  // Switch to login tab after a short delay
                  setTimeout(() => {
                        switchTab('login');
                        document.getElementById('loginUsername').value = username;
                  }, 1500);
            } else {
                  showMessage(data.detail || '注册失败，请稍后重试', 'error');
            }
      } catch (error) {
            console.error('Register error:', error);
            showMessage('网络错误，请稍后重试', 'error');
      } finally {
            registerBtn.disabled = false;
            registerBtn.textContent = '注册';
      }
}
