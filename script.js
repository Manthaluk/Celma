// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCn55poT-Cwqc0pf3yq7ENJaFxe5LPiY1c",
  authDomain: "celma-one.firebaseapp.com",
  projectId: "celma-one",
  storageBucket: "celma-one.firebasestorage.app",
  messagingSenderId: "175778538918",
  appId: "1:175778538918:web:a2311dd94035fb8d391b67",
  measurementId: "G-L3GF1L5E82"
  // Your Firebase config here
};
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = firebase.auth();

// --- Universal State
let currentUser = null;
let friends = [];
let rejectedUsers = [];
let chats = [];
let unreadChats = [];
let activeChatUser = null;
let activeChatId = null;
let chatMessageUnsub = null;

// --- Universal DOM
const menuBtn = document.getElementById('menuBtn');
const sideMenu = document.getElementById('sideMenu');
if (menuBtn && sideMenu) {
  menuBtn.addEventListener('click', () => {
    if (sideMenu.style.width === "250px") {
      sideMenu.style.width = "0";
    } else {
      sideMenu.style.width = "250px";
    }
  });
}
window.toggleTheme = function() {
  document.body.classList.toggle('dark-mode');
};
window.logoutFn = function() {
  auth.signOut().then(() => {
    window.location.href = 'index.html';
  });
};

// ---- INDEX.HTML (Sign in) ----
const loginForm = document.getElementById('loginForm');
const googleSignInBtn = document.getElementById('googleSignInBtn');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const forgotPasswordPopup = document.getElementById('forgotPasswordPopup');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
const verificationPopup = document.getElementById('verificationPopup');
const verificationForm = document.getElementById('verificationForm');
const newPasswordPopup = document.getElementById('newPasswordPopup');
const newPasswordForm = document.getElementById('newPasswordForm');

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginBtn');
    btn.querySelector('.btn-text').classList.add('hidden');
    btn.querySelector('.loading-spinner').classList.remove('hidden');
    try {
      await auth.signInWithEmailAndPassword(email, password);
      window.location.href = "home.html";
    } catch (err) {
      document.getElementById('loginError').textContent = "Incorrect email or password.";
    }
    btn.querySelector('.btn-text').classList.remove('hidden');
    btn.querySelector('.loading-spinner').classList.add('hidden');
  });
}
if (googleSignInBtn) {
  googleSignInBtn.addEventListener('click', async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      await auth.signInWithPopup(provider);
      window.location.href = "home.html";
    } catch (err) {
      document.getElementById('loginError').textContent = "Google sign-in failed.";
    }
  });
}
if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener('click', () => {
    forgotPasswordPopup.classList.remove('hidden');
  });
  window.closeForgotPasswordPopup = function() {
    forgotPasswordPopup.classList.add('hidden');
  };
}
if (forgotPasswordForm) {
  forgotPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('resetEmail').value.trim();
    try {
      await auth.sendPasswordResetEmail(email);
      document.getElementById('resetError').textContent = '';
      document.getElementById('resetSuccess').classList.remove('hidden');
    } catch (err) {
      document.getElementById('resetError').textContent = "Failed to send reset email.";
    }
  });
}
if (verificationForm) {
  verificationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Your verification logic here if you use codes
  });
  window.closeVerificationPopup = function() {
    verificationPopup.classList.add('hidden');
  };
}
if (newPasswordForm) {
  newPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Your new password logic here
  });
  window.closeNewPasswordPopup = function() {
    newPasswordPopup.classList.add('hidden');
  };
}

// ---- SIGNUP.HTML ----
const signupForm = document.getElementById('signupForm');
if (signupForm) {
  // Populate age dropdown
  const ageSelect = document.getElementById('age');
  if (ageSelect) {
    for (let i = 18; i <= 99; i++) {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = i;
      ageSelect.appendChild(opt);
    }
  }
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const firstName = document.getElementById('firstName').value.trim();
    const surname = document.getElementById('surname').value.trim();
    const nickname = document.getElementById('nickname').value.trim();
    const gender = document.getElementById('gender').value;
    const age = Number(document.getElementById('age').value);
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const btn = document.getElementById('signupBtn');
    btn.querySelector('.btn-text').classList.add('hidden');
    btn.querySelector('.loading-spinner').classList.remove('hidden');
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      await db.collection('users').doc(userCredential.user.uid).set({
        displayName: firstName + " " + surname,
        nickname,
        gender,
        age,
        email,
        friends: [],
        rejected: [],
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      window.location.href = "home.html";
    } catch (err) {
      document.getElementById('signupError').textContent = err.message || "Sign up failed.";
    }
    btn.querySelector('.btn-text').classList.remove('hidden');
    btn.querySelector('.loading-spinner').classList.add('hidden');
  });
}

// ---- SETTINGS.HTML ----
const settingsForm = document.getElementById('settingsForm');
const settingsFirstName = document.getElementById('settingsFirstName');
const settingsSurname = document.getElementById('settingsSurname');
const settingsNickname = document.getElementById('settingsNickname');
const settingsGender = document.getElementById('settingsGender');
const settingsAge = document.getElementById('settingsAge');
const settingsPassword = document.getElementById('settingsPassword');
const settingsBio = document.getElementById('settingsBio');
const showOnlineStatus = document.getElementById('showOnlineStatus');
const hideFromSearch = document.getElementById('hideFromSearch');
const settingsBtn = document.getElementById('settingsBtn');
const privacyBtn = document.getElementById('privacyBtn');

if (settingsForm && settingsFirstName && settingsSurname && settingsNickname && settingsGender && settingsAge) {
  // Populate age dropdown
  for (let i = 18; i <= 99; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = i;
    settingsAge.appendChild(opt);
  }
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      currentUser = user;
      const doc = await db.collection('users').doc(user.uid).get();
      if (doc.exists) {
        const d = doc.data();
        const [first, ...rest] = (d.displayName || '').split(' ');
        settingsFirstName.value = first || '';
        settingsSurname.value = rest.join(' ') || '';
        settingsNickname.value = d.nickname || '';
        settingsGender.value = d.gender || '';
        settingsAge.value = d.age || '';
        if (settingsBio) settingsBio.value = d.bio || '';
        if (showOnlineStatus) showOnlineStatus.checked = !!d.onlineStatus;
        if (hideFromSearch) hideFromSearch.checked = !!d.hideFromSearch;
      }
    }
  });
  settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    settingsBtn.querySelector('.btn-text').classList.add('hidden');
    settingsBtn.querySelector('.loading-spinner').classList.remove('hidden');
    const displayName = settingsFirstName.value + " " + settingsSurname.value;
    const nickname = settingsNickname.value;
    const gender = settingsGender.value;
    const age = Number(settingsAge.value);
    const bio = settingsBio ? settingsBio.value : '';
    const updates = { displayName, nickname, gender, age, bio };
    if (settingsPassword.value) {
      await currentUser.updatePassword(settingsPassword.value).catch(()=>{});
    }
    await db.collection('users').doc(currentUser.uid).update(updates);
    settingsBtn.querySelector('.btn-text').classList.remove('hidden');
    settingsBtn.querySelector('.loading-spinner').classList.add('hidden');
  });
  window.savePrivacySettings = async function() {
    privacyBtn.querySelector('.btn-text').classList.add('hidden');
    privacyBtn.querySelector('.loading-spinner').classList.remove('hidden');
    await db.collection('users').doc(currentUser.uid).update({
      onlineStatus: !!showOnlineStatus.checked,
      hideFromSearch: !!hideFromSearch.checked
    });
    privacyBtn.querySelector('.btn-text').classList.remove('hidden');
    privacyBtn.querySelector('.loading-spinner').classList.add('hidden');
  };
}

// ---- HOME.HTML (Friends, Messages, Chat, Search) ----
const friendsListDiv = document.getElementById('friendsList');
const allChatsDiv = document.getElementById('allChats');
const friendsPanel = document.getElementById('friendsPanel');
const messagesPanel = document.getElementById('messagesPanel');
const friendsBtn = document.getElementById('friendsBtn');
const messagesBtn = document.getElementById('messagesBtn');
const newMessagesNotification = document.getElementById('newMessagesNotification');
const messagesNewBanner = document.getElementById('messagesNewBanner');
const messagePopup = document.getElementById('messagePopup');
const chatUserEmoji = document.getElementById('chatUserEmoji');
const chatUserName = document.getElementById('chatUserName');
const chatUserInfo = document.getElementById('chatUserInfo');
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const searchResultsEl = document.getElementById('searchResults');
const findFriendsPanel = document.getElementById('findFriendsPanel');
const findFriendsToggle = document.getElementById('findFriendsToggle');

if (friendsPanel && messagesPanel) {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      currentUser = user;
      await loadUserFriendsAndRejected();
      loadFriendsList();
      loadChats();
    } else {
      window.location.href = 'index.html';
    }
  });

  async function loadUserFriendsAndRejected() {
    try {
      const userDoc = await db.collection('users').doc(currentUser.uid).get();
      if (userDoc.exists) {
        const data = userDoc.data();
        friends = data.friends || [];
        rejectedUsers = data.rejected || [];
      } else {
        friends = [];
        rejectedUsers = [];
        await db.collection('users').doc(currentUser.uid).set({
          friends: [],
          rejected: [],
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  function loadFriendsList() {
    friendsListDiv.innerHTML = '';
    if (friends.length === 0) {
      friendsListDiv.innerHTML = '<p class="text-gray-600">You have no friends added yet.</p>';
      return;
    }
    friends.forEach(async (friendId) => {
      try {
        const friendDoc = await db.collection('users').doc(friendId).get();
        if (!friendDoc.exists) return;
        const friend = friendDoc.data();
        const friendCard = document.createElement('div');
        friendCard.className = "flex items-center justify-between p-3 mb-3 rounded-lg bg-gray-100 dark:bg-gray-800 shadow";
        friendCard.innerHTML = `
          <div class="flex items-center">
            <img src="${friend.photoURL || 'logo.png'}" alt="${friend.nickname || friend.displayName || 'User'}" class="w-12 h-12 rounded-full object-cover mr-3" onerror="this.style.display='none';">
            <div>
              <div class="font-semibold text-lg text-purple-700">${friend.nickname || friend.displayName || 'User'}</div>
              <div class="text-sm text-gray-500">${friend.gender ? friend.gender.charAt(0).toUpperCase() + friend.gender.slice(1) : ''}${friend.age ? ', Age ' + friend.age : ''}</div>
            </div>
          </div>
          <div class="flex gap-2">
            <button class="btn-secondary" onclick="removeFriend('${friendId}')">Uninterested</button>
            <button class="btn-primary" onclick="openChatWithUser('${friendId}')">Message</button>
          </div>
        `;
        friendsListDiv.appendChild(friendCard);
      } catch (error) {
        console.error('Error loading friend data:', error);
      }
    });
  }

  window.removeFriend = function(friendId) {
    if (!confirm('Remove this friend? This will delete your chat history with them.')) return;
    friends = friends.filter(id => id !== friendId);
    db.collection('users').doc(currentUser.uid).update({ friends });
    const chatId = [currentUser.uid, friendId].sort().join('_');
    db.collection('chats').doc(chatId).delete().catch(() => {});
    loadFriendsList();
    loadChats();
  };

  window.openChatWithUser = async function(friendId) {
    activeChatUser = friendId;
    const doc = await db.collection('users').doc(friendId).get();
    if (!doc.exists) return;
    const data = doc.data();
    chatUserName.textContent = data.nickname || data.displayName || 'User';
    chatUserInfo.textContent = `${data.gender || ''}${data.age ? ', Age ' + data.age : ''}`;
    chatUserEmoji.textContent = getGenderEmoji(data.gender);
    messagePopup.classList.remove('hidden');
    loadChatMessages(friendId);
    markMessagesAsRead(friendId);
  };

  function getGenderEmoji(gender) {
    if (!gender) return '👤';
    gender = gender.toLowerCase();
    if (gender === 'male') return '👨';
    if (gender === 'female') return '👩';
    if (gender === 'non-binary') return '🧑';
    return '👤';
  }

  window.closeMessagePopup = function() {
    messagePopup.classList.add('hidden');
    chatMessages.innerHTML = '';
    activeChatUser = null;
    if (chatMessageUnsub) {
      chatMessageUnsub();
      chatMessageUnsub = null;
    }
  };

  function loadChatMessages(friendId) {
    const chatId = [currentUser.uid, friendId].sort().join('_');
    activeChatId = chatId;
    chatMessages.innerHTML = '<div class="text-gray-400">Loading...</div>';
    if (chatMessageUnsub) chatMessageUnsub();
    chatMessageUnsub = db.collection('chats').doc(chatId)
      .collection('messages').orderBy('timestamp')
      .onSnapshot(snapshot => {
        chatMessages.innerHTML = '';
        snapshot.forEach(doc => {
          const msg = doc.data();
          const isMe = msg.sender === currentUser.uid;
          const msgDiv = document.createElement('div');
          msgDiv.className = `p-2 rounded-lg ${isMe ? 'bg-purple-200 self-end text-right' : 'bg-gray-200 self-start text-left'} max-w-xs my-1`;
          msgDiv.textContent = msg.text;
          chatMessages.appendChild(msgDiv);
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
      });
  }

  window.sendMessageFn = async function() {
    const text = messageInput.value.trim();
    if (!text || !activeChatUser) return;
    const chatId = [currentUser.uid, activeChatUser].sort().join('_');
    const msgData = {
      text,
      sender: currentUser.uid,
      receiver: activeChatUser,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      read: false
    };
    await db.collection('chats').doc(chatId).collection('messages').add(msgData);
    await db.collection('chats').doc(chatId).set({
      users: [currentUser.uid, activeChatUser],
      lastMessage: text,
      lastTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
      [`unread_${activeChatUser}`]: true
    }, { merge: true });
    messageInput.value = '';
  };

  function markMessagesAsRead(friendId) {
    const chatId = [currentUser.uid, friendId].sort().join('_');
    db.collection('chats').doc(chatId).update({
      [`unread_${currentUser.uid}`]: false
    });
  }

  function loadChats() {
    db.collection('chats')
      .where('users', 'array-contains', currentUser.uid)
      .orderBy('lastTimestamp', 'desc')
      .onSnapshot(async (snapshot) => {
        chats = [];
        unreadChats = [];
        for (const doc of snapshot.docs) {
          const data = doc.data();
          const otherUserId = data.users.find(uid => uid !== currentUser.uid);
          const userDoc = await db.collection('users').doc(otherUserId).get();
          if (!userDoc.exists) continue;
          const userInfo = { id: otherUserId, ...userDoc.data() };
          const unread = data[`unread_${currentUser.uid}`] === true;
          if (unread) unreadChats.push(doc.id);
          chats.push({
            chatId: doc.id,
            lastMessage: data.lastMessage,
            lastTimestamp: data.lastTimestamp ? data.lastTimestamp.toDate() : null,
            userInfo,
            unread
          });
        }
        renderChats();
        if (unreadChats.length > 0) {
          newMessagesNotification.classList.remove('hidden');
          if (messagesNewBanner) messagesNewBanner.classList.remove('hidden');
        } else {
          newMessagesNotification.classList.add('hidden');
          if (messagesNewBanner) messagesNewBanner.classList.add('hidden');
        }
      });
  }

  function renderChats() {
    allChatsDiv.innerHTML = '';
    if (chats.length === 0) {
      allChatsDiv.innerHTML = '<div class="text-gray-500">No conversations yet.</div>';
      return;
    }
    chats.forEach(chat => {
      const chatDiv = document.createElement('div');
      chatDiv.className = `flex items-center justify-between p-3 mb-3 rounded-lg ${chat.unread ? 'bg-yellow-100 dark:bg-yellow-900' : 'bg-gray-100 dark:bg-gray-800'} shadow`;
      chatDiv.innerHTML = `
        <div class="flex items-center cursor-pointer" onclick="openChatWithUser('${chat.userInfo.id}')">
          <img src="${chat.userInfo.photoURL || 'logo.png'}" alt="${chat.userInfo.nickname || chat.userInfo.displayName || 'User'}" class="w-12 h-12 rounded-full object-cover mr-3" onerror="this.style.display='none';">
          <div>
            <div class="font-semibold text-lg text-purple-700">${chat.userInfo.nickname || chat.userInfo.displayName || 'User'}</div>
            <div class="text-sm text-gray-500">${chat.userInfo.gender ? chat.userInfo.gender.charAt(0).toUpperCase() + chat.userInfo.gender.slice(1) : ''}${chat.userInfo.age ? ', Age ' + chat.userInfo.age : ''}</div>
            <div class="text-sm mt-1 ${chat.unread ? 'font-bold text-yellow-700' : 'text-gray-400'}">${chat.lastMessage ? truncate(chat.lastMessage, 50) : ''}</div>
          </div>
        </div>
        <div class="flex gap-2">
          <button class="btn-primary" onclick="openChatWithUser('${chat.userInfo.id}')">Message</button>
          ${chat.unread ? `<span class="ml-2 text-xs font-bold text-yellow-600">NEW</span>` : ''}
        </div>
      `;
      allChatsDiv.appendChild(chatDiv);
    });
  }
  function truncate(str, n) {
    return (str && str.length > n) ? str.substr(0, n - 1) + '…' : (str || "");
  }

  // Panel toggle
  window.showFriendsPanelFn = function() {
    friendsPanel.classList.remove('hidden');
    messagesPanel.classList.add('hidden');
    friendsBtn.classList.add('active');
    messagesBtn.classList.remove('active');
  };
  window.showMessagesPanelFn = function() {
    messagesPanel.classList.remove('hidden');
    friendsPanel.classList.add('hidden');
    messagesBtn.classList.add('active');
    friendsBtn.classList.remove('active');
  };

  // --- Friend Search ----
  if (findFriendsToggle && findFriendsPanel) {
    findFriendsToggle.addEventListener('click', () => {
      findFriendsPanel.classList.toggle('hidden');
    });
  }
  const minAgeFilter = document.getElementById('minAgeFilter');
  const maxAgeFilter = document.getElementById('maxAgeFilter');
  if (minAgeFilter && maxAgeFilter) {
    for (let i = 18; i <= 99; i++) {
      const optionMin = document.createElement('option');
      optionMin.value = i;
      optionMin.textContent = i;
      minAgeFilter.appendChild(optionMin);
      const optionMax = document.createElement('option');
      optionMax.value = i;
      optionMax.textContent = i;
      maxAgeFilter.appendChild(optionMax);
    }
  }
  window.searchFriendsFn = async function() {
    searchResultsEl.innerHTML = '';
    const gender = document.getElementById('genderFilter').value;
    const minAge = parseInt(minAgeFilter.value) || 0;
    const maxAge = parseInt(maxAgeFilter.value) || 150;
    if (minAge > maxAge) {
      alert('Min age cannot be greater than max age.');
      return;
    }
    const searchBtn = document.getElementById('searchFriendsBtn');
    searchBtn.querySelector('.btn-text').classList.add('hidden');
    searchBtn.querySelector('.loading-spinner').classList.remove('hidden');
    try {
      let query = db.collection('users');
      if (gender) {
        query = query.where('gender', '==', gender);
      }
      const snapshot = await query.get();
      const users = [];
      snapshot.forEach(doc => {
        if (doc.id === currentUser.uid) return;
        const data = doc.data();
        if (data.age >= minAge && data.age <= maxAge) {
          users.push({ id: doc.id, ...data });
        }
      });
      const filteredUsers = users.filter(u => !friends.includes(u.id) && !rejectedUsers.includes(u.id));
      if (filteredUsers.length === 0) {
        searchResultsEl.innerHTML = '<p class="text-gray-600">No users found matching your criteria.</p>';
      }
      filteredUsers.forEach(user => {
        const userCard = document.createElement('div');
        userCard.className = 'user-card p-3 mb-3 border rounded-lg bg-white dark:bg-gray-800';
        userCard.innerHTML = `
          <div class="mb-2">
            <strong>${user.displayName || 'Unnamed'}</strong> (${user.gender || 'Unknown'}, ${user.age || 'Unknown'})
          </div>
          <div class="flex gap-2">
            <button class="btn-primary" onclick="markInterested('${user.id}')">👍 Interested</button>
            <button class="btn-secondary" onclick="markNotInterested('${user.id}')">👎 Not Interested</button>
            <button class="btn-secondary" onclick="openChatWithUser('${user.id}')">💬 Message</button>
          </div>
        `;
        searchResultsEl.appendChild(userCard);
      });
    } catch (error) {
      alert('Error searching users.');
    } finally {
      searchBtn.querySelector('.btn-text').classList.remove('hidden');
      searchBtn.querySelector('.loading-spinner').classList.add('hidden');
    }
  };
  window.markInterested = async function(userId) {
    if (friends.includes(userId)) return;
    friends.push(userId);
    await db.collection('users').doc(currentUser.uid).update({ friends });
    rejectedUsers = rejectedUsers.filter(id => id !== userId);
    await db.collection('users').doc(currentUser.uid).update({ rejected: rejectedUsers });
    await getOrCreateChat(userId);
    loadFriendsList();
    alert('Added to friends! You can now message them.');
    removeUserFromSearchResults(userId);
  };
  window.markNotInterested = async function(userId) {
    if (rejectedUsers.includes(userId)) return;
    rejectedUsers.push(userId);
    await db.collection('users').doc(currentUser.uid).update({ rejected: rejectedUsers });
    alert('User marked as not interested and will not appear in future searches.');
    removeUserFromSearchResults(userId);
  };
  function removeUserFromSearchResults(userId) {
    const cards = Array.from(searchResultsEl.querySelectorAll('.user-card'));
    for (const card of cards) {
      if (card.querySelector('button[onclick*="' + userId + '"]')) {
        card.remove();
        break;
      }
    }
  }
  async function getOrCreateChat(friendId) {
    const ids = [currentUser.uid, friendId].sort();
    const chatId = ids.join('_');
    const chatRef = db.collection('chats').doc(chatId);
    const chatDoc = await chatRef.get();
    if (!chatDoc.exists) {
      await chatRef.set({
        users: ids,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    }
    return chatId;
  }
}

// --- End script.js ---