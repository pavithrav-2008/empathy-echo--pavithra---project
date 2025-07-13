document.addEventListener('DOMContentLoaded', () => {
  const admin = localStorage.getItem('loggedInAdmin');
  if (!admin) {
    alert('Unauthorized. Please login as admin.');
    window.location.href = 'admin.html';
    return;
  }

  const userList = document.getElementById('user-list');
  const users = JSON.parse(localStorage.getItem('users') || '[]');

  users.forEach(user => {
    const logKey = `empathyEchoLog_${user.username}`;
    const log = JSON.parse(localStorage.getItem(logKey) || '[]');

    const container = document.createElement('div');
    container.className = 'user-card';

    const title = document.createElement('h3');
    title.textContent = `User: ${user.username}`;

    // Create Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete User';
    deleteBtn.style.marginLeft = '1rem';
    deleteBtn.style.padding = '0.3rem 0.6rem';
    deleteBtn.style.backgroundColor = '#f44336';
    deleteBtn.style.color = 'white';
    deleteBtn.style.border = 'none';
    deleteBtn.style.borderRadius = '5px';
    deleteBtn.style.cursor = 'pointer';

    deleteBtn.addEventListener('click', () => {
      if (confirm(`Are you sure you want to delete user "${user.username}"?`)) {
        deleteUser(user.username);
        container.remove();
      }
    });

    title.appendChild(deleteBtn);
    container.appendChild(title);

    const chartCanvas = document.createElement('canvas');
    const canvasId = `chart-${user.username}`;
    chartCanvas.id = canvasId;
    container.appendChild(chartCanvas);

    const entryList = document.createElement('div');
    entryList.className = 'journal-entries';
    log.forEach(entry => {
      const entryEl = document.createElement('div');
      entryEl.textContent = `[${entry.time}] ${entry.sender.toUpperCase()}: ${entry.text}`;
      entryList.appendChild(entryEl);
    });
    container.appendChild(entryList);

    userList.appendChild(container);

    renderChart(canvasId, log);
  });

  function analyzeSentiment(text) {
    const negativeWords = ['sad', 'angry', 'upset', 'worried', 'anxious', 'overwhelmed'];
    const positiveWords = ['happy', 'excited', 'joy', 'good', 'great', 'awesome', 'fantastic'];
    if (negativeWords.some(w => text.toLowerCase().includes(w))) return 'Negative';
    if (positiveWords.some(w => text.toLowerCase().includes(w))) return 'Positive';
    return 'Neutral';
  }

  function renderChart(canvasId, log) {
    const labels = [];
    const sentimentMap = { 'Positive': 0, 'Neutral': 0, 'Negative': 0 };

    log.forEach(entry => {
      if (entry.sender === 'user') {
        const sentiment = analyzeSentiment(entry.text);
        sentimentMap[sentiment]++;
        labels.push(entry.time);
      }
    });

    const ctx = document.getElementById(canvasId).getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(sentimentMap),
        datasets: [{
          label: 'Mood Frequency',
          data: Object.values(sentimentMap),
          backgroundColor: ['#4CAF50', '#FFC107', '#F44336']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Sentiment Summary'
          }
        }
      }
    });
  }
});

function deleteUser(username) {
  let users = JSON.parse(localStorage.getItem('users') || '[]');
  users = users.filter(user => user.username !== username);
  localStorage.setItem('users', JSON.stringify(users));
  localStorage.removeItem(`empathyEchoLog_${username}`);
  alert(`User "${username}" deleted temporarily from localStorage.`);
}

function logoutAdmin() {
  localStorage.removeItem('loggedInAdmin');
  window.location.href = 'index.html';
}
