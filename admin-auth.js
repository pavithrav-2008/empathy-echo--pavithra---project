// File: admin-auth.js
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('admin-login-form');
  const signupForm = document.getElementById('admin-signup-form');
  const showSignup = document.getElementById('admin-show-signup');
  const showLogin = document.getElementById('admin-show-login');

  // Toggle between login/signup
  showSignup.addEventListener('click', e => {
    e.preventDefault();
    toggleForms(signupForm);
  });

  showLogin.addEventListener('click', e => {
    e.preventDefault();
    toggleForms(loginForm);
  });

  function toggleForms(show) {
    [loginForm, signupForm].forEach(f => f.classList.add('hidden'));
    show.classList.remove('hidden');
  }

  // Sign Up Handler
  signupForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('admin-signup-email').value.trim();
    const username = document.getElementById('admin-signup-username').value.trim();
    const password = document.getElementById('admin-signup-password').value.trim();

    let admins = JSON.parse(localStorage.getItem('adminUsers') || '[]');
    if (admins.find(u => u.username === username)) {
      alert('Admin username already exists');
      return;
    }

    admins.push({ email, username, password });
    localStorage.setItem('adminUsers', JSON.stringify(admins));
    alert('Admin registered! Please login.');
    toggleForms(loginForm);
  });

  // Login Handler
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const username = document.getElementById('admin-login-username').value.trim();
    const password = document.getElementById('admin-login-password').value.trim();

    const admins = JSON.parse(localStorage.getItem('adminUsers') || '[]');
    const admin = admins.find(u => u.username === username && u.password === password);

    if (!admin) {
      alert('Invalid admin credentials');
      return;
    }

    localStorage.setItem('loggedInAdmin', username);
    alert('Admin login successful!');
    window.location.href = 'admin-dashboard.html';
  });
});
