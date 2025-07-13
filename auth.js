document.addEventListener('DOMContentLoaded', () => {
  // Auth Elements
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const forgotForm = document.getElementById('forgot-form');
  const resetForm = document.getElementById('reset-form');
  const showSignup = document.getElementById('show-signup');
  const showLogin = document.getElementById('show-login');
  const forgotLink = document.getElementById('forgot-link');
  const backToLogin1 = document.getElementById('back-to-login1');
  let currentEmail = '';

  // Toggle auth forms
  showSignup.addEventListener('click', e => {
    e.preventDefault();
    toggleForms(signupForm);
  });
  showLogin.addEventListener('click', e => {
    e.preventDefault();
    toggleForms(loginForm);
  });
  forgotLink.addEventListener('click', e => {
    e.preventDefault();
    toggleForms(forgotForm);
  });
  backToLogin1.addEventListener('click', e => {
    e.preventDefault();
    toggleForms(loginForm);
  });

  // Signup handler
  signupForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value.trim();
    const username = document.getElementById('signup-username').value.trim();
    const password = document.getElementById('signup-password').value.trim();
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.find(u => u.username === username)) {
      alert('Username taken');
      return;
    }
    users.push({ email, username, password });
    localStorage.setItem('users', JSON.stringify(users));
    alert('Signup successful! Please login.');
    toggleForms(loginForm);
  });

  // Login handler
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
      alert('Invalid credentials');
      return;
    }
    alert('Login successful!');
    // Store logged-in username/session in localStorage (simple)
    localStorage.setItem('loggedInUser', username);
    // Redirect to main app page
    window.location.href = 'role.html';
  });

  // Forgot password
  forgotForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('forgot-email').value.trim();
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    if (!users.find(u => u.email === email)) {
      alert('Email not found');
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    let codes = JSON.parse(localStorage.getItem('resetCodes') || '{}');
    codes[email] = code;
    localStorage.setItem('resetCodes', JSON.stringify(codes));
    currentEmail = email;
    alert(`Verification code: ${code}`); // Simulated email
    toggleForms(resetForm);
  });

  // Reset password
  resetForm.addEventListener('submit', e => {
    e.preventDefault();
    const code = document.getElementById('reset-code').value.trim();
    const newPass = document.getElementById('reset-password').value.trim();
    const confirmPass = document.getElementById('reset-password-confirm').value.trim();
    let codes = JSON.parse(localStorage.getItem('resetCodes') || '{}');
    if (codes[currentEmail] !== code) {
      alert('Invalid code');
      return;
    }
    if (newPass !== confirmPass) {
      alert('Passwords do not match');
      return;
    }
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    users = users.map(u => (u.email === currentEmail ? { ...u, password: newPass } : u));
    localStorage.setItem('users', JSON.stringify(users));
    delete codes[currentEmail];
    localStorage.setItem('resetCodes', JSON.stringify(codes));
    alert('Password reset! Please login.');
    toggleForms(loginForm);
  });

  function toggleForms(show) {
    [loginForm, signupForm, forgotForm, resetForm].forEach(f => f.classList.add('hidden'));
    show.classList.remove('hidden');
  }
});
