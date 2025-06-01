// Elite Fashions Chat Application - Combined and Enhanced Version
class EliteFashionsChat {
    constructor() {
        this.currentUser = null;
        this.selectedUserId = null;
        this.db = null;
        this.unsubscribers = [];
        this.isAdmin = false;
        this.chatUnsubscriber = null;
        this.users = new Map();
        this.typingTimeout = null;
        this.lastActivity = Date.now();
        this.activityCheckInterval = null;
        this.firstMessageFromURL = null;
        
        this.initializeApp();
    }

    async initializeApp() {
        this.firstMessageFromURL = new URLSearchParams(window.location.search).get("message");

        try {
            this.showLoading(true);

            // Import Firebase modules
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js');
            const { 
                getFirestore, 
                collection, 
                addDoc, 
                query, 
                orderBy, 
                onSnapshot, 
                doc, 
                setDoc, 
                getDoc, 
                getDocs, 
                serverTimestamp, 
                where, 
                updateDoc,
                deleteDoc,
                limit
            } = await import('https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js');

            // Firebase Configuration
            const firebaseConfig = {
                apiKey: "AIzaSyCNl1eLCccchmMvUNf29EtTUbMn_FO_nuU",
                authDomain: "data-4e1c7.firebaseapp.com",
                projectId: "data-4e1c7",
                storageBucket: "data-4e1c7.firebasestorage.app",
                messagingSenderId: "844230746094",
                appId: "1:844230746094:web:7834ae9aaf29eccc3d38ff"
            };

            // Initialize Firebase with config
            this.app = initializeApp(firebaseConfig);
            this.db = getFirestore(this.app);

            // Store Firebase functions
            this.firebase = {
                collection,
                addDoc,
                query,
                orderBy,
                onSnapshot,
                doc,
                setDoc,
                getDoc,
                getDocs,
                serverTimestamp,
                where,
                updateDoc,
                deleteDoc,
                limit
            };

            // Initialize EmailJS if available
            if (window.emailJSConfig && window.emailJSConfig.publicKey) {
                emailjs.init(window.emailJSConfig.publicKey);
            }

            this.initializeEventListeners();
            this.initializeTheme();
            this.requestNotificationPermission();
            this.startActivityTracking();
            this.showLoading(false);

        } catch (error) {
            console.error('Error initializing app:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
            this.showLoading(false);
        }
    }

    initializeEventListeners() {
        // Authentication form events
        const authForm = document.getElementById('authForm');
        const toggleAuth = document.getElementById('toggleAuth');
        const authSubmit = document.getElementById('authSubmit');
        const nameGroup = document.getElementById('nameGroup');

        let isSignUp = false;

        authForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (isSignUp) {
                this.handleSignUp();
            } else {
                this.handleLogin();
            }
        });

        toggleAuth?.addEventListener('click', () => {
            isSignUp = !isSignUp;
            this.clearMessages();
            
            if (isSignUp) {
                authSubmit.innerHTML = '<i class="fas fa-user-plus"></i> Sign Up';
                toggleAuth.innerHTML = '<i class="fas fa-sign-in-alt"></i> Already have an account? Sign In';
                nameGroup.style.display = 'block';
            } else {
                authSubmit.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
                toggleAuth.innerHTML = '<i class="fas fa-user-plus"></i> Need an account? Sign Up';
                nameGroup.style.display = 'none';
            }
        });

        // Theme toggle
        document.getElementById('themeToggle')?.addEventListener('click', () => {
            this.toggleTheme();
        });

        // User menu
        const userMenuBtn = document.getElementById('userMenuBtn');
        const userMenuDropdown = document.getElementById('userMenuDropdown');

        userMenuBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            userMenuDropdown.classList.toggle('show');
        });

        document.addEventListener('click', () => {
            userMenuDropdown?.classList.remove('show');
        });

        // Menu toggle for mobile
        document.getElementById('menuToggle')?.addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Admin panel toggle
        document.getElementById('toggleAdminPanel')?.addEventListener('click', () => {
            this.toggleAdminPanel();
        });

        // Logout with confirmation
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.showLogoutConfirmation();
        });

        // Logout confirmation modal
        document.getElementById('confirmLogout')?.addEventListener('click', () => {
            this.signOut();
        });

        document.getElementById('cancelLogout')?.addEventListener('click', () => {
            this.hideLogoutConfirmation();
        });

        document.getElementById('closeLogoutModal')?.addEventListener('click', () => {
            this.hideLogoutConfirmation();
        });

        // Close admin panel
        document.getElementById('closeAdminBtn')?.addEventListener('click', () => {
            this.closeAdminPanel();
        });

        // Refresh users
        document.getElementById('refreshUsers')?.addEventListener('click', () => {
            this.refreshUserList();
        });

        // Message form
        const messageForm = document.getElementById('messageForm');
        const messageInput = document.getElementById('messageInput');

        messageForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage();
        });

        // Message input enhancements
        messageInput?.addEventListener('input', (e) => {
            this.updateCharacterCount();
            this.handleTyping();
        });

        messageInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Close chat
        document.getElementById('closeChatBtn')?.addEventListener('click', () => {
            this.closeChat();
        });

        // Back to welcome (mobile)
        document.getElementById('backToWelcome')?.addEventListener('click', () => {
            this.closeChat();
        });

        // Clear chat
        document.getElementById('clearChatBtn')?.addEventListener('click', () => {
            this.clearChatHistory();
        });

        // Email user button
        document.getElementById('emailUserBtn')?.addEventListener('click', () => {
            this.openEmailModal();
        });

        // Email modal
        document.getElementById('closeEmailModal')?.addEventListener('click', () => {
            this.closeEmailModal();
        });

        document.getElementById('cancelEmail')?.addEventListener('click', () => {
            this.closeEmailModal();
        });

        document.getElementById('emailForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendEmail();
        });

        // User search
        const userSearch = document.getElementById('userSearch');
        const clearSearch = document.getElementById('clearSearch');

        userSearch?.addEventListener('input', (e) => {
            this.filterUsers(e.target.value);
            this.toggleClearSearch(e.target.value);
        });

        clearSearch?.addEventListener('click', () => {
            userSearch.value = '';
            this.filterUsers('');
            this.toggleClearSearch('');
        });

        // Activity tracking
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
            document.addEventListener(event, () => {
                this.lastActivity = Date.now();
            });
        });

        // Window focus/blur for presence
        window.addEventListener('focus', () => {
            this.updateUserPresence('online');
        });

        window.addEventListener('blur', () => {
            this.updateUserPresence('away');
        });

        // Before unload
        window.addEventListener('beforeunload', () => {
            this.updateUserPresence('offline');
        });
    }

    async handleLogin() {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        
        if (!email || !password) {
            this.showError('Please enter both email and password.');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showError('Please enter a valid email address.');
            return;
        }

        try {
            this.showLoading(true);

            // Check for admin login
            if (email === "Abcd1234567@gmail.com" && password === "Abcd1234567") {
                this.currentUser = { 
                    uid: 'admin', 
                    email: email, 
                    displayName: 'Admin',
                    role: 'admin'
                };
                this.isAdmin = true;
                this.showChatPanel();
                this.loadAdminUsers();
                this.showToast('Welcome Admin!', 'success');
                return;
            }

            // Check regular user login
            const q = this.firebase.query(
                this.firebase.collection(this.db, 'users_data'),
                this.firebase.where('username', '==', email),
                this.firebase.where('password', '==', password)
            );
            
            const snapshot = await this.firebase.getDocs(q);
            
            if (snapshot.empty) {
                this.showError('Invalid username or password. Please sign up if you\'re new.');
                return;
            }

            const userData = snapshot.docs[0].data();
            this.currentUser = { 
                uid: snapshot.docs[0].id, 
                email: email, 
                displayName: userData.displayName || email.split('@')[0],
                role: 'user'
            };
            this.isAdmin = false;
            this.showChatPanel();
            this.loadUserChat(this.currentUser.uid);
            this.showToast(`Welcome back, ${this.currentUser.displayName}!`, 'success');
            
            // Auto-send first message from URL if it exists
            if (this.firstMessageFromURL && !localStorage.getItem("messageSentOnce")) {
                setTimeout(() => {
                    const decoded = decodeURIComponent(this.firstMessageFromURL);
                    document.getElementById("messageInput").value = decoded;
                    this.sendMessage();
                    localStorage.setItem("messageSentOnce", "true");
                }, 1000);
            }

        } catch (error) {
            console.error('Error during login:', error);
            this.showError('Login failed. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    async handleSignUp() {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        const displayName = document.getElementById('displayName').value.trim();
        
        if (!email || !password) {
            this.showError('Please enter both email and password.');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showError('Please enter a valid email address.');
            return;
        }

        if (password.length < 6) {
            this.showError('Password must be at least 6 characters long.');
            return;
        }

        try {
            this.showLoading(true);

            // Check if user already exists
            const q = this.firebase.query(
                this.firebase.collection(this.db, 'users_data'),
                this.firebase.where('username', '==', email)
            );
            
            const snapshot = await this.firebase.getDocs(q);
            
            if (!snapshot.empty) {
                this.showError('Email already registered. Please sign in instead.');
                return;
            }

            // Create new user
            await this.firebase.addDoc(this.firebase.collection(this.db, 'users_data'), {
                username: email,
                displayName: displayName || email.split('@')[0],
                password: password,
                role: 'you',
                createdAt: this.firebase.serverTimestamp(),
                lastSeen: this.firebase.serverTimestamp(),
                status: 'offline'
            });

            this.showSuccess('Account created successfully! You can now sign in.');
            
            // Clear form and switch to login
            document.getElementById('email').value = '';
            document.getElementById('password').value = '';
            document.getElementById('displayName').value = '';
            document.getElementById('toggleAuth').click();

        } catch (error) {
            console.error('Error during sign up:', error);
            this.showError('Sign up failed. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    showChatPanel() {
        document.getElementById('authPanel').style.display = 'none';
        document.getElementById('chatPanel').style.display = 'flex';
        this.updateUserInfo();
    }

    signOut() {
        this.hideLogoutConfirmation();
        this.updateUserPresence('offline').then(() => {
            this.cleanupSubscriptions();
            this.currentUser = null;
            this.selectedUserId = null;
            this.isAdmin = false;
            this.users.clear();
            document.getElementById('chatPanel').style.display = 'none';
            document.getElementById('authPanel').style.display = 'flex';
            this.clearMessages();
            localStorage.removeItem("messageSentOnce");
            this.showToast('Signed out successfully', 'success');
        });
    }

    showLogoutConfirmation() {
        document.getElementById('logoutModal').style.display = 'flex';
    }

    hideLogoutConfirmation() {
        document.getElementById('logoutModal').style.display = 'none';
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    updateUserInfo() {
        if (this.currentUser) {
            const userNameElement = document.getElementById('userName');
            const userInitialsElement = document.getElementById('userInitials');
            
            if (userNameElement) {
                userNameElement.textContent = this.currentUser.displayName;
            }
            
            if (userInitialsElement) {
                userInitialsElement.textContent = this.generateInitials(this.currentUser.displayName);
            }
        }
    }

    generateInitials(name) {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }

    async loadAdminUsers() {
        if (!this.isAdmin) return;

        try {
            const usersRef = this.firebase.collection(this.db, 'users_data');
            
            this.unsubscribers.push(
                this.firebase.onSnapshot(usersRef, (snapshot) => {
                    this.renderAdminUsers(snapshot);
                    this.updateAdminUserList(snapshot);
                })
            );
        } catch (error) {
            console.error('Error loading admin users:', error);
            this.showError('Failed to load users.');
        }
    }

    async loadUserChat(userId) {
        if (this.isAdmin) return;

        try {
            this.selectedUserId = 'admin'; // Users always chat with admin
            this.startChatWithAdmin();
        } catch (error) {
            console.error('Error loading user chat:', error);
            this.showError('Failed to load chat.');
        }
    }

    renderAdminUsers(snapshot) {
        const usersList = document.getElementById('usersList');
        if (!usersList) return;

        usersList.innerHTML = '';
        const users = [];

        snapshot.forEach((doc) => {
            const userData = { id: doc.id, ...doc.data() };
            users.push(userData);
        });

        // Sort users by last activity
        users.sort((a, b) => {
            const aTime = a.lastSeen ? a.lastSeen.toDate() : new Date(0);
            const bTime = b.lastSeen ? b.lastSeen.toDate() : new Date(0);
            return bTime - aTime;
        });

        users.forEach((userData) => {
            const userDiv = document.createElement('div');
            userDiv.className = 'user-item';
            userDiv.dataset.userId = userData.id;
            
            const lastSeen = userData.lastSeen ? userData.lastSeen.toDate() : null;
            const lastSeenText = lastSeen ? this.formatMessageTime(lastSeen) : 'Never';
            const status = userData.status || 'offline';
            
            userDiv.innerHTML = `
                <div class="user-avatar">
                    <div class="avatar-circle">
                        ${this.generateInitials(userData.displayName || userData.username)}
                    </div>
                    <div class="status-indicator status-${status}"></div>
                </div>
                <div class="user-info">
                    <div class="user-name">${this.escapeHtml(userData.displayName || userData.username)}</div>
                    <div class="user-email">${this.escapeHtml(userData.username)}</div>
                    <div class="user-status">Last seen: ${lastSeenText}</div>
                </div>
                <div class="user-actions">
                    <button class="btn-icon" onclick="app.startChatWithUser('${userData.id}', '${this.escapeHtml(userData.displayName || userData.username)}', '${this.escapeHtml(userData.username)}')" title="Start Chat">
                        <i class="fas fa-comment"></i>
                    </button>
                    <button class="btn-icon" onclick="app.openEmailModalForUser('${userData.id}', '${this.escapeHtml(userData.username)}', '${this.escapeHtml(userData.displayName || userData.username)}')" title="Send Email">
                        <i class="fas fa-envelope"></i>
                    </button>
                </div>
            `;
            
            usersList.appendChild(userDiv);
        });

        this.updateStats(users.length);
    }

    updateAdminUserList(snapshot) {
        // Update user count and other stats
        const totalUsers = snapshot.size;
        this.updateStats(totalUsers);
    }

    startChatWithAdmin() {
        this.selectedUserId = 'admin';
        document.getElementById('chatWelcome').style.display = 'none';
        document.getElementById('chatMessages').style.display = 'flex';
        
        // Load messages for this chat
        this.loadMessages();
        
        // Update chat header
        document.getElementById('chatUserName').textContent = 'Admin';
        document.getElementById('chatUserStatus').textContent = 'Online';
        
        this.showToast('Chat with Admin started', 'info');
    }

    async startChatWithUser(userId, displayName, email) {
        this.selectedUserId = userId;
        document.getElementById('chatWelcome').style.display = 'none';
        document.getElementById('chatMessages').style.display = 'flex';
        
        // Update chat header
        document.getElementById('chatUserName').textContent = displayName;
        document.getElementById('chatUserStatus').textContent = 'User';
        
        // Load messages for this chat
        this.loadMessages();
        
        // Mark messages as read
        await this.markMessagesAsRead(userId);
        
        this.showToast(`Chat with ${displayName} opened`, 'info');
    }

    loadMessages() {
        if (!this.selectedUserId) return;

        // Clean up previous listener
        if (this.chatUnsubscriber) {
            this.chatUnsubscriber();
        }

        try {
            const messagesRef = this.firebase.collection(this.db, 'messages');
            let q;

            if (this.isAdmin) {
                // Admin sees messages between admin and selected user
                q = this.firebase.query(
                    messagesRef,
                    this.firebase.where('participants', 'array-contains-any', [this.currentUser.uid, this.selectedUserId]),
                    this.firebase.orderBy('timestamp', 'asc')
                );
            } else {
                // User sees messages between user and admin
                q = this.firebase.query(
                    messagesRef,
                    this.firebase.where('participants', 'array-contains-any', [this.currentUser.uid, 'admin']),
                    this.firebase.orderBy('timestamp', 'asc')
                );
            }

            this.chatUnsubscriber = this.firebase.onSnapshot(q, (snapshot) => {
                if (this.isAdmin) {
                    this.renderAdminMessages(snapshot);
                } else {
                    this.renderUserMessages(snapshot);
                }
            });
        } catch (error) {
            console.error('Error loading messages:', error);
            this.showError('Failed to load messages.');
        }
    }

    renderUserMessages(snapshot) {
        const messagesContainer = document.getElementById('messagesContainer');
        if (!messagesContainer) return;

        messagesContainer.innerHTML = '';
        
        snapshot.forEach((doc) => {
            const messageData = { id: doc.id, ...doc.data() };
            
            // Only show messages between user and admin
            if ((messageData.senderId === this.currentUser.uid && messageData.recipientId === 'admin') ||
                (messageData.senderId === 'admin' && messageData.recipientId === this.currentUser.uid)) {
                this.createMessageElement(messageData, messagesContainer);
            }
        });

        this.scrollToBottom();
    }

    renderAdminMessages(snapshot) {
        const messagesContainer = document.getElementById('messagesContainer');
        if (!messagesContainer) return;

        messagesContainer.innerHTML = '';
        
        snapshot.forEach((doc) => {
            const messageData = { id: doc.id, ...doc.data() };
            
            // Show messages between admin and selected user
            if ((messageData.senderId === 'admin' && messageData.recipientId === this.selectedUserId) ||
                (messageData.senderId === this.selectedUserId && messageData.recipientId === 'admin')) {
                this.createMessageElement(messageData, messagesContainer);
            }
        });

        this.scrollToBottom();
    }

    createMessageElement(message, container) {
        const messageDiv = document.createElement('div');
        const isOwn = message.senderId === this.currentUser.uid;
        
        messageDiv.className = `message ${isOwn ? 'own' : 'other'}`;
        
        const timestamp = message.timestamp ? message.timestamp.toDate() : new Date();
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text">${this.renderMessageContent(message.message)}</div>
                <div class="message-time">${this.formatMessageTime(timestamp)}</div>
            </div>
        `;
        
        container.appendChild(messageDiv);
    }

    showEmptyState() {
        const messagesContainer = document.getElementById('messagesContainer');
        if (messagesContainer) {
            messagesContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments"></i>
                    <p>No messages yet. Start the conversation!</p>
                </div>
            `;
        }
    }

    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();
        
        if (!message || !this.selectedUserId) return;
        
        if (message.length > 500) {
            this.showError('Message is too long (max 500 characters)');
            return;
        }

        try {
            const messageData = {
                senderId: this.currentUser.uid,
                recipientId: this.selectedUserId,
                message: message,
                timestamp: this.firebase.serverTimestamp(),
                participants: [this.currentUser.uid, this.selectedUserId],
                senderName: this.currentUser.displayName,
                read: false
            };

            await this.firebase.addDoc(this.firebase.collection(this.db, 'messages'), messageData);
            
            messageInput.value = '';
            this.updateCharacterCount();
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.showError('Failed to send message. Please try again.');
        }
    }

    async markMessagesAsRead(userId) {
        try {
            const messagesRef = this.firebase.collection(this.db, 'messages');
            const q = this.firebase.query(
                messagesRef,
                this.firebase.where('senderId', '==', userId),
                this.firebase.where('recipientId', '==', this.currentUser.uid),
                this.firebase.where('read', '==', false)
            );

            const snapshot = await this.firebase.getDocs(q);
            
            const batch = [];
            snapshot.forEach((doc) => {
                batch.push(this.firebase.updateDoc(doc.ref, { read: true }));
            });

            await Promise.all(batch);
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    }

    updateCharacterCount() {
        const messageInput = document.getElementById('messageInput');
        const charCount = document.getElementById('charCount');
        
        if (messageInput && charCount) {
            const length = messageInput.value.length;
            charCount.textContent = `${length}/500`;
            
            if (length > 500) {
                charCount.style.color = '#ef4444';
                messageInput.style.borderColor = '#ef4444';
            } else {
                charCount.style.color = '#6b7280';
                messageInput.style.borderColor = '';
            }
        }
    }

    handleTyping() {
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }
        
        this.typingTimeout = setTimeout(() => {
            // Handle typing indicator if needed
        }, 1000);
    }

    formatMessageTime(timestamp) {
        const now = new Date();
        const messageTime = new Date(timestamp);
        const diffInHours = (now - messageTime) / (1000 * 60 * 60);
        
        if (diffInHours < 24) {
            return messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffInHours < 48) {
            return 'Yesterday ' + messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            return messageTime.toLocaleDateString() + ' ' + messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    renderMessageContent(content) {
        // Basic text rendering with URL detection
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return this.escapeHtml(content).replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('messagesContainer');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    showMessagesLoading(show) {
        const loadingElement = document.getElementById('messagesLoading');
        if (loadingElement) {
            loadingElement.style.display = show ? 'flex' : 'none';
        }
    }

    closeChat() {
        this.selectedUserId = null;
        if (this.chatUnsubscriber) {
            this.chatUnsubscriber();
            this.chatUnsubscriber = null;
        }
        
        document.getElementById('chatMessages').style.display = 'none';
        document.getElementById('chatWelcome').style.display = 'flex';
        
        // Clear message input
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.value = '';
            this.updateCharacterCount();
        }
    }

    async clearChatHistory() {
        if (!this.selectedUserId) return;
        
        if (!confirm('Are you sure you want to clear the chat history? This action cannot be undone.')) {
            return;
        }

        try {
            // Clear messages from UI
            const messagesContainer = document.getElementById('messagesContainer');
            if (messagesContainer) {
                messagesContainer.innerHTML = '';
                this.showEmptyState();
            }
            
            this.showToast('Chat history cleared', 'success');
        } catch (error) {
            console.error('Error clearing chat:', error);
            this.showError('Failed to clear chat history.');
        }
    }

    openEmailModal() {
        if (!this.selectedUserId) return;
        
        const modal = document.getElementById('emailModal');
        const recipientEmail = document.getElementById('recipientEmail');
        
        if (modal && recipientEmail) {
            // Get recipient email from user data
            if (this.isAdmin && this.selectedUserId !== 'admin') {
                // Admin sending to user
                const userElement = document.querySelector(`[data-user-id="${this.selectedUserId}"] .user-email`);
                if (userElement) {
                    recipientEmail.value = userElement.textContent;
                }
            }
            
            modal.style.display = 'flex';
        }
    }

    openEmailModalForUser(userId, email, displayName) {
        const modal = document.getElementById('emailModal');
        const recipientEmail = document.getElementById('recipientEmail');
        const emailSubject = document.getElementById('emailSubject');
        
        if (modal && recipientEmail && emailSubject) {
            recipientEmail.value = email;
            emailSubject.value = `Message from Elite Fashions - ${displayName}`;
            modal.style.display = 'flex';
        }
    }

    closeEmailModal() {
        const modal = document.getElementById('emailModal');
        if (modal) {
            modal.style.display = 'none';
            
            // Clear form
            document.getElementById('emailSubject').value = '';
            document.getElementById('emailMessage').value = '';
            document.getElementById('recipientEmail').value = '';
        }
    }

    async sendEmail() {
        const subject = document.getElementById('emailSubject').value.trim();
        const message = document.getElementById('emailMessage').value.trim();
        const recipientEmail = document.getElementById('recipientEmail').value.trim();
        
        if (!subject || !message) {
            this.showError('Please fill in all required fields.');
            return;
        }
        
        if (recipientEmail && !this.isValidEmail(recipientEmail)) {
            this.showError('Please enter a valid email address.');
            return;
        }

        try {
            this.showLoading(true, 'Sending email...');

            // Check if EmailJS is configured
            if (!window.emailJSConfig || !window.emailJSConfig.publicKey) {
                this.showError('Email service is not configured.');
                return;
            }

            const templateParams = {
                to_email: recipientEmail,
                subject: subject,
                message: message,
                from_name: this.currentUser.displayName || 'Elite Fashions'
            };

            await emailjs.send(
                window.emailJSConfig.serviceId || 'default_service',
                window.emailJSConfig.templateId || 'default_template',
                templateParams
            );

            this.showSuccess('Email sent successfully!');
            this.closeEmailModal();
            
        } catch (error) {
            console.error('Error sending email:', error);
            this.showError('Failed to send email. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    filterUsers(searchTerm) {
        const userItems = document.querySelectorAll('.user-item');
        const lowerSearchTerm = searchTerm.toLowerCase();
        
        userItems.forEach(item => {
            const userName = item.querySelector('.user-name').textContent.toLowerCase();
            const userEmail = item.querySelector('.user-email').textContent.toLowerCase();
            
            if (userName.includes(lowerSearchTerm) || userEmail.includes(lowerSearchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    toggleClearSearch(value) {
        const clearButton = document.getElementById('clearSearch');
        if (clearButton) {
            clearButton.style.display = value ? 'block' : 'none';
        }
    }

    refreshUserList() {
        if (this.isAdmin) {
            this.loadAdminUsers();
        }
        this.showToast('User list refreshed', 'success');
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const chatMessages = document.getElementById('chatMessages');
        
        if (sidebar && chatMessages) {
            sidebar.classList.toggle('sidebar-mobile');
            sidebar.classList.toggle('open');
        }
    }

    hideSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.remove('open');
        }
    }

    toggleAdminPanel() {
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel) {
            const isVisible = adminPanel.style.display !== 'none';
            adminPanel.style.display = isVisible ? 'none' : 'block';
        }
    }

    closeAdminPanel() {
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel) {
            adminPanel.style.display = 'none';
        }
    }

    updateStats(totalUsers) {
        const totalUsersElement = document.getElementById('totalUsers');
        const onlineUsersElement = document.getElementById('onlineUsers');
        
        if (totalUsersElement) {
            totalUsersElement.textContent = totalUsers;
        }
        
        if (onlineUsersElement) {
            // Count online users
            const onlineCount = document.querySelectorAll('.status-online').length;
            onlineUsersElement.textContent = onlineCount;
        }
    }

    async updateUserPresence(status) {
        if (!this.currentUser || this.currentUser.uid === 'admin') return;

        try {
            const userDocRef = this.firebase.doc(this.db, 'users_data', this.currentUser.uid);
            await this.firebase.updateDoc(userDocRef, {
                status: status,
                lastSeen: this.firebase.serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating presence:', error);
        }
    }

    startActivityTracking() {
        this.activityCheckInterval = setInterval(() => {
            const timeSinceLastActivity = Date.now() - this.lastActivity;
            
            if (timeSinceLastActivity > 300000) { // 5 minutes
                this.updateUserPresence('away');
            } else if (timeSinceLastActivity > 60000) { // 1 minute
                this.updateUserPresence('away');
            } else {
                this.updateUserPresence('online');
            }
        }, 60000); // Check every minute
    }

    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.showToast('Notifications enabled', 'success');
                }
            });
        }
    }

    showNotification(title, body, icon) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: body,
                icon: icon || '/favicon.ico',
                silent: false
            });
        }
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        const currentTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
        
        document.documentElement.setAttribute('data-theme', currentTheme);
        this.updateThemeIcon(currentTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(newTheme);
        
        this.showToast(`Switched to ${newTheme} theme`, 'info');
    }

    updateThemeIcon(theme) {
        const themeIcon = document.getElementById('themeIcon');
        if (themeIcon) {
            themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    showLoading(show, message = 'Loading...') {
        const loadingElement = document.getElementById('loadingOverlay');
        const loadingMessage = document.getElementById('loadingMessage');
        
        if (loadingElement) {
            loadingElement.style.display = show ? 'flex' : 'none';
        }
        
        if (loadingMessage) {
            loadingMessage.textContent = message;
        }
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    clearMessages() {
        const messagesContainer = document.getElementById('messagesContainer');
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
        }
        
        // Clear any error messages
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(el => el.remove());
    }

    showToast(message, type = 'info', duration = 4000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icon = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        }[type] || 'fas fa-info-circle';
        
        toast.innerHTML = `
            <i class="${icon}"></i>
            <span>${this.escapeHtml(message)}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        let toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        
        toastContainer.appendChild(toast);
        
        // Auto remove after duration
        setTimeout(() => {
            this.removeToast(toast);
        }, duration);
    }

    removeToast(toast) {
        if (toast && toast.parentElement) {
            toast.classList.add('toast-exit');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }
    }

    cleanupSubscriptions() {
        // Clean up Firebase listeners
        this.unsubscribers.forEach(unsubscriber => {
            if (typeof unsubscriber === 'function') {
                unsubscriber();
            }
        });
        this.unsubscribers = [];
        
        if (this.chatUnsubscriber) {
            this.chatUnsubscriber();
            this.chatUnsubscriber = null;
        }
        
        // Clear activity tracking
        if (this.activityCheckInterval) {
            clearInterval(this.activityCheckInterval);
            this.activityCheckInterval = null;
        }
    }
}

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new EliteFashionsChat();
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    if (app) {
        app.showError('An unexpected error occurred. Please refresh the page.');
    }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (app) {
        app.showError('A network error occurred. Please check your connection.');
    }
});