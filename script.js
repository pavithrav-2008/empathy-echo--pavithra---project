document.addEventListener('DOMContentLoaded', () => {
  const loggedInUser = localStorage.getItem('loggedInUser');
  if (!loggedInUser) {
    window.location.href = 'login.html';
    return;
  }

  const chatContainer = document.getElementById('chat-container');
  const journalContainer = document.getElementById('journal-container');
  const journalLog = document.getElementById('journal-log');
  const userInput = document.getElementById('user-input');
  const sendBtn = document.getElementById('send-btn');
  const toggleBtn = document.getElementById('toggle-btn');
  const STORAGE_KEY = `empathyEchoLog_${loggedInUser}`;

  const hour = new Date().getHours();
  let greeting = "";
  if (hour < 12) {
    greeting = `Good morning, ${loggedInUser} ☀️ Hope you have a calm start.`;
  } else if (hour < 18) {
    greeting = `Good afternoon, ${loggedInUser} 🌤️ How's your day going?`;
  } else if (hour < 22) {
    greeting = `Good evening, ${loggedInUser} 🌙 Hope you're doing okay.`;
  } else {
    greeting = `Still up, ${loggedInUser}? 🌌 I'm here if you're feeling restless.`;
  }
  appendMessage(greeting, 'bot');

  const affirmations = [
    "I am doing the best I can, and that is enough.",
    "I am worthy of love and kindness.",
    "This moment does not define me.",
    "My feelings are valid and I accept them.",
    "I choose to respond with calm and clarity.",
    "I trust myself to navigate this day."
  ];

  const gratitudePrompts = [
    "What made you smile recently?",
    "Name one person you're thankful for and why.",
    "What’s something small you often take for granted?",
    "What’s one thing today that made you feel good?"
  ];

  const journalingPrompts = [
    "What’s been weighing on me today is...",
    "If my emotions could speak, they would say...",
    "One thing I wish I could express but haven’t is...",
    "Right now, I need to remind myself that..."
  ];

  loadJournal();
  greetUser();

  toggleBtn.addEventListener('click', () => {
    chatContainer.classList.toggle('hidden');
    journalContainer.classList.toggle('hidden');
    toggleBtn.textContent = journalContainer.classList.contains('hidden') ? 'View Journal' : 'Back to Chat';
  });

  sendBtn.addEventListener('click', handleUserMessage);
  userInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleUserMessage();
  });

  function greetUser() {
    const hasGreeted = sessionStorage.getItem('greetedUser');
    if (hasGreeted) return;

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const currentUser = users.find(u => u.username === loggedInUser);
    const displayName = currentUser?.username || 'there';
    const log = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

    showTyping();
    setTimeout(() => {
      removeTyping();
      const welcomeMessage = log.length === 0
        ? `Nice to meet you, ${displayName}!! 😊 I'm Echo — your listening buddy. How are you feeling today?`
        : `Hey, ${displayName}! 😊 Good to see you again. What’s on your mind today?`;
      appendMessage(welcomeMessage, 'bot');
      saveToJournal(welcomeMessage, 'bot');
      showMoodButtons();
      sessionStorage.setItem('greetedUser', 'true');
    }, 1000);
  }

  function showMoodButtons() {
    const container = document.createElement('div');
    container.className = 'message bot';
    container.style.display = 'flex';
    container.style.gap = '1rem';

    const moods = [
      { emoji: '😊', text: 'I feel happy!' },
      { emoji: '😐', text: 'I feel okay.' },
      { emoji: '😢', text: 'I feel a bit down.' }
    ];

    moods.forEach(mood => {
      const btn = document.createElement('button');
      btn.textContent = mood.emoji;
      btn.style.fontSize = '1.5rem';
      btn.style.border = 'none';
      btn.style.background = 'transparent';
      btn.style.cursor = 'pointer';

      btn.onclick = () => {
        appendMessage(mood.text, 'user');
        saveToJournal(mood.text, 'user');
        setTimeout(() => {
          const { mainReply, followUp, actionType } = generateBotResponse(mood.text);
          appendBotReplyInteractive(mainReply);
          setTimeout(() => {
            appendBotReplyInteractive(followUp);
            if (actionType) showSpecialFollowUp(actionType);
          }, 1000);
        }, 600);
        container.remove();
      };

      container.appendChild(btn);
    });

    chatContainer.appendChild(container);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  function handleUserMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    const lower = text.toLowerCase();

    if (lower.includes("affirmation")) {
      appendMessage(text, 'user');
      saveToJournal(text, 'user');
      showRandomAffirmation();
      userInput.value = '';
      return;
    }
    if (lower.includes("gratitude")) {
      appendMessage(text, 'user');
      saveToJournal(text, 'user');
      showRandomGratitudePrompt();
      userInput.value = '';
      return;
    }
    if (lower.includes("journaling")) {
      appendMessage(text, 'user');
      saveToJournal(text, 'user');
      showRandomJournalingPrompt();
      userInput.value = '';
      return;
    }
    if (lower.includes("boost me")) {
      appendMessage(text, 'user');
      saveToJournal(text, 'user');
      showRandomMoodBooster();
      userInput.value = '';
      return;
    }

    appendMessage(text, 'user');
    saveToJournal(text, 'user');
    userInput.value = '';

    setTimeout(() => {
      const { mainReply, followUp, actionType } = generateBotResponse(text);
      appendBotReplyInteractive(mainReply);
      setTimeout(() => {
        appendBotReplyInteractive(followUp);
        if (actionType) showSpecialFollowUp(actionType);
      }, 1000);
    }, 600);
  }

  function analyzeSentiment(t) {
    const input = t.toLowerCase();
    const moodMap = {
      positive: ['happy', 'joy', 'good', 'great', 'excited', 'awesome', 'grateful', 'calm'],
      negative: ['sad', 'depressed', 'down', 'hopeless', 'cry'],
      stressed: ['stressed', 'overwhelmed', 'burnt out', 'pressure'],
      anxious: ['anxious', 'worried', 'nervous', 'panic', 'scared'],
      angry: ['angry', 'mad', 'frustrated', 'irritated'],
      tired: ['tired', 'exhausted', 'drained', 'fatigued'],
      lonely: ['lonely', 'isolated', 'alone', 'ignored'],
      neutral: ['okay', 'meh', 'fine']
    };
    for (let mood in moodMap) {
      if (moodMap[mood].some(word => input.includes(word))) return mood;
    }
    return 'neutral';
  }

  function generateBotResponse(input) {
    const sentiment = analyzeSentiment(input);
    const random = arr => arr[Math.floor(Math.random() * arr.length)];
    const responses = {
      positive: {
        main: ["I'm so happy to hear that! 🎉", "That's amazing news! What made your day great? 💛"],
        follow: "Would you like to save this moment with a gratitude note? (type gratitude) ",
        action: 'gratitude'
      },
      negative: {
        main: ["I'm really sorry you're feeling this way. You're not alone. 💙", "Would you like to talk more about what’s been going on?"],
        follow: "I can stay with you, or we can write it out together. (type journaling) ",
        action: 'journaling'
      },
      stressed: {
        main: ["It sounds like there's a lot on your plate right now. 🧠", "Let’s pause for a moment — you deserve a break. 💆"],
        follow: "Want to try a quick breathing exercise? (type breathing) ",
        action: 'breathing'
      },
      anxious: {
        main: ["Anxiety can be overwhelming — I’m here with you. 🫂", "Let’s take a deep breath together. You're safe here. 🌱"],
        follow: "Would you like a calming activity? (type breathing) ",
        action: 'breathing'
      },
      angry: {
        main: ["It’s okay to feel angry — emotions aren’t bad. 💢", "Want to write out what made you feel this way?"],
        follow: "Sometimes expressing it helps. Journaling might support you. (type journaling) ",
        action: 'journaling'
      },
      tired: {
        main: ["You sound worn out. It’s okay to rest. 💤", "Rest is productive too. 🛌"],
        follow: "Need a gentle affirmation to wind down? (type affirmation) ",
        action: 'affirmation'
      },
      lonely: {
        main: ["Feeling alone can be really hard — I’m here for you. 💙", "Even when you feel isolated, you're not invisible."],
        follow: "Want a small affirmation or journal prompt? (type affirmation) ",
        action: 'affirmation'
      },
      neutral: {
        main: ["Just another regular day, huh? That’s totally okay. 🕊️", "Thanks for checking in. I'm here either way."],
        follow: "Would you like a mood booster or affirmation? (type affirmation) ",
        action: 'affirmation'
      }
    };

    const selected = responses[sentiment] || responses.neutral;
    return {
      mainReply: random(selected.main),
      followUp: selected.follow,
      actionType: selected.action
    };
  }

  function showSpecialFollowUp(type) {
    const wrapper = document.createElement('div');
    wrapper.className = 'message bot';

    if (type === 'breathing') {
      wrapper.innerHTML = `
        Feeling overwhelmed? Let’s try a short breathing exercise together.<br>
        <a href="https://www.youtube.com/watch?v=nmFUDkj1Aq0" target="_blank">🧘 Click here to begin</a>`;
      chatContainer.appendChild(wrapper);
    } else {
      wrapper.innerHTML = `What would you like to try next?<br>`;

      const options = [
        { label: '💫 Affirmation', action: showRandomAffirmation },
        { label: '✍️ Journaling', action: showRandomJournalingPrompt },
        { label: '🌼 Gratitude', action: showRandomGratitudePrompt },
        { label: '🌈 Mood Booster', action: showRandomMoodBooster }
      ];

      const btnContainer = document.createElement('div');
      btnContainer.style.display = 'flex';
      btnContainer.style.flexWrap = 'wrap';
      btnContainer.style.gap = '0.5rem';
      btnContainer.style.marginTop = '0.5rem';

      options.forEach(opt => {
        const btn = document.createElement('button');
        btn.textContent = opt.label;
        btn.style.padding = '0.4rem 1rem';
        btn.style.borderRadius = '6px';
        btn.style.border = 'none';
        btn.style.background = '#6c63ff';
        btn.style.color = '#fff';
        btn.style.cursor = 'pointer';
        btn.onclick = () => opt.action();
        btnContainer.appendChild(btn);
      });

      wrapper.appendChild(btnContainer);
      chatContainer.appendChild(wrapper);
    }

    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  function appendMessage(txt, sndr) {
    const m = document.createElement('div');
    m.className = `message ${sndr}`;
    m.textContent = txt;
    chatContainer.appendChild(m);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  function appendBotReplyInteractive(message, delay = 1000) {
    showTyping();
    setTimeout(() => {
      removeTyping();
      appendMessage(message, 'bot');
      saveToJournal(message, 'bot');
    }, delay);
  }

  function showTyping() {
    const typing = document.createElement('div');
    typing.className = 'message bot typing-indicator';
    typing.id = 'typing';
    typing.innerHTML = `<span class="dot"></span><span class="dot"></span><span class="dot"></span>`;
    chatContainer.appendChild(typing);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  function removeTyping() {
    const typing = document.getElementById('typing');
    if (typing) typing.remove();
  }

  function showRandomAffirmation() {
    const wrapper = document.createElement('div');
    wrapper.className = 'message bot';
    const quote = affirmations[Math.floor(Math.random() * affirmations.length)];
    wrapper.innerHTML = `Here's one: <em>"${quote}"</em> 💫`;
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  function showRandomGratitudePrompt() {
    const wrapper = document.createElement('div');
    wrapper.className = 'message bot';
    const prompt = gratitudePrompts[Math.floor(Math.random() * gratitudePrompts.length)];
    wrapper.innerHTML = `Gratitude prompt: <em>"${prompt}"</em> 🌼`;
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  function showRandomJournalingPrompt() {
    const wrapper = document.createElement('div');
    wrapper.className = 'message bot';
    const prompt = journalingPrompts[Math.floor(Math.random() * journalingPrompts.length)];
    wrapper.innerHTML = `Journaling prompt: <em>"${prompt}"</em> ✍️`;
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  function showRandomMoodBooster() {
    const wrapper = document.createElement('div');
    wrapper.className = 'message bot';

    const boosters = [
      "🎵 Here's a quick boost: <a href='https://www.youtube.com/watch?v=ZbZSe6N_BXs' target='_blank'>Happy by Pharrell Williams</a>",
      "🧘‍♀️ Close your eyes and take 3 deep breaths. In... out... again...",
      "🌞 Step outside for 1 minute — feel the air, look at the sky.",
      "🙌 Sit up straight and smile — yes, even a fake one. It works!",
      "💡 Think of one thing you're proud of today. Got it? Nice.",
      "📸 If your mood were a photo, what would it look like? Describe it."
    ];

    const message = boosters[Math.floor(Math.random() * boosters.length)];
    wrapper.innerHTML = `🌈 Mood Booster: ${message}`;
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  function saveToJournal(text, sender) {
    const log = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    log.push({ text, sender, time: new Date().toLocaleString() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
    renderJournal(log);
  }

  function loadJournal() {
    renderJournal(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
  }

  function renderJournal(log) {
    journalLog.innerHTML = '';
    log.forEach(entry => {
      const li = document.createElement('li');
      li.textContent = `[${entry.time}] ${entry.sender.toUpperCase()}: ${entry.text}`;
      journalLog.appendChild(li);
    });
  }

  function logoutUser() {
    localStorage.removeItem('loggedInUser');
    sessionStorage.removeItem('greetedUser');
    window.location.href = 'index.html';
  }

  window.logoutUser = logoutUser;
});
