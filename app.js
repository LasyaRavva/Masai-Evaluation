
const authPage = document.getElementById('authPage');
const appPage = document.getElementById('appPage');
const loadingSpinner = document.getElementById('loadingSpinner');

const signInForm = document.getElementById('signInForm');
const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const googleSignInBtn = document.getElementById('googleSignInBtn');
const authError = document.getElementById('authError');
const logoutBtn = document.getElementById('logoutBtn');

// Activity Logger Elements
const activityDate = document.getElementById('activityDate');
const activityForm = document.getElementById('activityForm');
const activityName = document.getElementById('activityName');
const activityCategory = document.getElementById('activityCategory');
const activityDuration = document.getElementById('activityDuration');
const activitiesList = document.getElementById('activitiesList');
const remainingMinutes = document.getElementById('remainingMinutes');
const usedProgress = document.getElementById('usedProgress');
const formError = document.getElementById('formError');
const analyseBtn = document.getElementById('analyseBtn');
const analyseButtonContainer = document.getElementById('analyseButtonContainer');


const dashboardSection = document.getElementById('dashboardSection');
const closeDashboard = document.getElementById('closeDashboard');
const noDataView = document.getElementById('noDataView');
const totalHours = document.getElementById('totalHours');
const totalActivities = document.getElementById('totalActivities');


let currentUser = null;
let currentDate = null;
let chartInstance = null;
const MINUTES_IN_DAY = 1440;


document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
 
    if (!auth || !db) {
        console.error("Firebase not initialized yet. Retrying...");
        setTimeout(initializeApp, 500);
        return;
    }

    
    const today = new Date().toISOString().split('T')[0];
    if (activityDate) {
        activityDate.value = today;
    }
    currentDate = today;

   
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            console.log("User logged in:", user.email);
            showApp();
            loadActivities();
        } else {
            currentUser = null;
            console.log("User logged out");
            showAuth();
        }
    });

    // Event listeners - Add null checks
    if (signInForm) signInForm.addEventListener('submit', handleSignIn);
    if (registerForm) registerForm.addEventListener('submit', handleSignUp);
    if (googleSignInBtn) googleSignInBtn.addEventListener('click', handleGoogleSignIn);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (activityDate) activityDate.addEventListener('change', handleDateChange);
    if (activityForm) activityForm.addEventListener('submit', handleAddActivity);
    if (analyseBtn) analyseBtn.addEventListener('click', handleAnalyse);
    if (closeDashboard) closeDashboard.addEventListener('click', closeDashboardView);

    // Add toggle form listeners to all auth toggle links
    setTimeout(() => {
        document.querySelectorAll('.auth-toggle a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleAuthForm();
            });
        });
    }, 100);
}

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

function toggleAuthForm() {
    const loginFormEl = document.getElementById('loginForm');
    const signupFormEl = document.getElementById('signupForm');
    
    if (loginFormEl) loginFormEl.classList.toggle('hidden');
    if (signupFormEl) signupFormEl.classList.toggle('hidden');
}

async function handleSignIn(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showAuthError('Please enter both email and password');
        return;
    }

    showLoading(true);
    try {
        await auth.signInWithEmailAndPassword(email, password);
        clearAuthErrors();
        clearAuthForms();
        console.log("Sign in successful");
    } catch (error) {
        console.error("Sign in error:", error);
        let errorMessage = error.message;
        
        // Friendly error messages
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'No account found with this email. Please sign up first.';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Incorrect password. Please try again.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address.';
        } else if (error.code === 'auth/user-disabled') {
            errorMessage = 'This account has been disabled.';
        }
        
        showAuthError(errorMessage);
    } finally {
        showLoading(false);
    }
}

async function handleSignUp(e) {
    e.preventDefault();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirm').value;

    // Validation
    if (!email || !password || !confirmPassword) {
        showAuthError('Please fill in all fields');
        return;
    }

    if (password !== confirmPassword) {
        showAuthError('Passwords do not match');
        return;
    }

    if (password.length < 6) {
        showAuthError('Password must be at least 6 characters');
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showAuthError('Please enter a valid email address');
        return;
    }

    showLoading(true);
    try {
        await auth.createUserWithEmailAndPassword(email, password);
        clearAuthErrors();
        clearAuthForms();
        // Switch back to login form
        if (loginForm.classList.contains('hidden')) {
            toggleAuthForm();
        }
        showAuthError('Account created! Please sign in.');
        console.log("Sign up successful");
    } catch (error) {
        console.error("Sign up error:", error);
        let errorMessage = error.message;
        
        // Friendly error messages
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'This email is already registered. Please sign in or use a different email.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Password is too weak. Please use a stronger password.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address.';
        }
        
        showAuthError(errorMessage);
    } finally {
        showLoading(false);
    }
}

async function handleGoogleSignIn() {
    const provider = new firebase.auth.GoogleAuthProvider();
    showLoading(true);
    try {
        const result = await auth.signInWithPopup(provider);
        clearAuthErrors();
        clearAuthForms();
        console.log("Google sign in successful", result.user.email);
        showLoading(false);
    } catch (error) {
        console.error("Google sign in error:", error);
        let errorMessage = error.message;
        
        if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = 'Google sign in was cancelled. Please try again.';
            showLoading(false);
        } else if (error.code === 'auth/popup-blocked') {
            errorMessage = 'Sign in popup was blocked. Please enable popups.';
            showLoading(false);
        } else if (error.code === 'auth/unauthorized-domain') {
            errorMessage = 'This domain is not authorized. Please try again or contact support.';
            showLoading(false);
        } else {
            showLoading(false);
        }
        
        showAuthError(errorMessage);
    }
}

async function handleLogout() {
    showLoading(true);
    try {
        await auth.signOut();
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        showLoading(false);
    }
}

function showAuthError(message) {
    if (authError) {
        authError.textContent = message;
        authError.classList.remove('hidden');
        // Only auto-hide if it's an error (not a success message)
        if (!message.includes('created') && !message.includes('successful')) {
            setTimeout(() => {
                authError.classList.add('hidden');
            }, 5000);
        }
    }
}

function clearAuthErrors() {
    if (authError) {
        authError.classList.add('hidden');
        authError.textContent = '';
    }
}

function clearAuthForms() {
    signInForm.reset();
    registerForm.reset();
}



function showAuth() {
    authPage.classList.add('active');
    appPage.classList.remove('active');
}

function showApp() {
    authPage.classList.remove('active');
    appPage.classList.add('active');
}

function showLoading(show) {
    if (show) {
        loadingSpinner.classList.remove('hidden');
    } else {
        loadingSpinner.classList.add('hidden');
    }
}

async function handleDateChange(e) {
    currentDate = e.target.value;
    await loadActivities();
}

async function handleAddActivity(e) {
    e.preventDefault();
    formError.classList.add('hidden');

    const name = activityName.value.trim();
    const category = activityCategory.value;
    const duration = parseInt(activityDuration.value);

    if (!name || !duration || duration < 1) {
        showFormError('Please fill in all fields correctly');
        return;
    }

    // Check if adding this activity would exceed 1440 minutes
    const currentTotal = await getTotalMinutesForDate(currentDate);
    if (currentTotal + duration > MINUTES_IN_DAY) {
        showFormError(`Cannot add this activity. Only ${MINUTES_IN_DAY - currentTotal} minutes remaining for this day.`);
        return;
    }

    showLoading(true);
    try {
        const docRef = db.collection('users').doc(currentUser.uid)
            .collection('days').doc(currentDate)
            .collection('activities').doc();

        await docRef.set({
            id: docRef.id,
            name,
            category,
            duration,
            timestamp: new Date(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        activityForm.reset();
        await loadActivities();
    } catch (error) {
        showFormError('Failed to add activity: ' + error.message);
    } finally {
        showLoading(false);
    }
}

async function deleteActivity(activityId) {
    if (!confirm('Are you sure you want to delete this activity?')) return;

    showLoading(true);
    try {
        await db.collection('users').doc(currentUser.uid)
            .collection('days').doc(currentDate)
            .collection('activities').doc(activityId).delete();

        await loadActivities();
    } catch (error) {
        showFormError('Failed to delete activity: ' + error.message);
    } finally {
        showLoading(false);
    }
}

async function loadActivities() {
    try {
        const activitiesRef = db.collection('users').doc(currentUser.uid)
            .collection('days').doc(currentDate)
            .collection('activities');

        const snapshot = await activitiesRef.orderBy('createdAt', 'desc').get();
        const activities = [];

        snapshot.forEach(doc => {
            activities.push({ id: doc.id, ...doc.data() });
        });

        renderActivities(activities);
        updateTimeRemaining(activities);
        checkAnalyseButton(activities);
    } catch (error) {
        console.error('Error loading activities:', error);
        activitiesList.innerHTML = '<p class="empty-state">Error loading activities</p>';
    }
}

function renderActivities(activities) {
    if (activities.length === 0) {
        activitiesList.innerHTML = '<p class="empty-state">No activities logged yet. Start by adding an activity!</p>';
        return;
    }

    activitiesList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-info">
                <div class="activity-name">${escapeHtml(activity.name)}</div>
                <div class="activity-meta">
                    <span>${activity.category}</span>
                    <span>${formatTime(activity.duration)}</span>
                </div>
            </div>
            <div class="activity-duration">${activity.duration}m</div>
            <div class="activity-actions">
                <button class="btn-small" onclick="editActivity('${activity.id}')">Edit</button>
                <button class="btn-small btn-delete" onclick="deleteActivity('${activity.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

async function getTotalMinutesForDate(date) {
    try {
        const snapshot = await db.collection('users').doc(currentUser.uid)
            .collection('days').doc(date)
            .collection('activities').get();

        let total = 0;
        snapshot.forEach(doc => {
            total += doc.data().duration || 0;
        });
        return total;
    } catch (error) {
        console.error('Error getting total minutes:', error);
        return 0;
    }
}

function updateTimeRemaining(activities) {
    const totalUsed = activities.reduce((sum, activity) => sum + (activity.duration || 0), 0);
    const remaining = MINUTES_IN_DAY - totalUsed;

    remainingMinutes.textContent = remaining;
    const percentageUsed = (totalUsed / MINUTES_IN_DAY) * 100;
    usedProgress.style.width = percentageUsed + '%';

    
    if (percentageUsed > 90) {
        usedProgress.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
    } else if (percentageUsed > 75) {
        usedProgress.style.background = 'linear-gradient(90deg, #f59e0b, #d97706)';
    } else {
        usedProgress.style.background = 'linear-gradient(90deg, #6366f1, #ec4899)';
    }
}

function checkAnalyseButton(activities) {
    const totalMinutes = activities.reduce((sum, activity) => sum + (activity.duration || 0), 0);
    if (totalMinutes >= MINUTES_IN_DAY) {
        analyseButtonContainer.classList.remove('hidden');
    } else {
        analyseButtonContainer.classList.add('hidden');
    }
}

function showFormError(message) {
    formError.textContent = message;
    formError.classList.remove('hidden');
    setTimeout(() => {
        formError.classList.add('hidden');
    }, 5000);
}

async function editActivity(activityId) {

    alert('Edit functionality: Delete this activity and add a new one with the corrected details.');
}



async function handleAnalyse() {
    showDashboardView();
    const activities = await getActivitiesForDate(currentDate);

    if (activities.length === 0) {
        noDataView.classList.remove('hidden');
        return;
    }

    noDataView.classList.add('hidden');
    displayDashboardStats(activities);
    renderCategoryChart(activities);
}

async function getActivitiesForDate(date) {
    try {
        const snapshot = await db.collection('users').doc(currentUser.uid)
            .collection('days').doc(date)
            .collection('activities').get();

        const activities = [];
        snapshot.forEach(doc => {
            activities.push({ id: doc.id, ...doc.data() });
        });
        return activities;
    } catch (error) {
        console.error('Error getting activities:', error);
        return [];
    }
}

function displayDashboardStats(activities) {
    const totalMinutes = activities.reduce((sum, activity) => sum + (activity.duration || 0), 0);
    const totalHoursValue = (totalMinutes / 60).toFixed(1);

    totalHours.textContent = totalHoursValue + 'h';
    totalActivities.textContent = activities.length;
}

function renderCategoryChart(activities) {
    const categoryData = {};

    activities.forEach(activity => {
        const category = activity.category || 'Other';
        categoryData[category] = (categoryData[category] || 0) + activity.duration;
    });

    const labels = Object.keys(categoryData);
    const data = Object.values(categoryData);
    const colors = generateChartColors(labels.length);

    const ctx = document.getElementById('categoryChart').getContext('2d');

    
    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderColor: '#1e293b',
                borderWidth: 2,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#f1f5f9',
                        padding: 20,
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const hours = (value / 60).toFixed(1);
                            return `${label}: ${value}m (${hours}h)`;
                        }
                    }
                }
            }
        }
    });
}

function generateChartColors(count) {
    const baseColors = [
        '#6366f1',
        '#ec4899',
        '#10b981',
        '#f59e0b',
        '#ef4444',
        '#06b6d4',
        '#8b5cf6',
        '#14b8a6'
    ];

    const colors = [];
    for (let i = 0; i < count; i++) {
        colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
}

function showDashboardView() {
    dashboardSection.classList.remove('hidden');
}

function closeDashboardView() {
    dashboardSection.classList.add('hidden');
}



function formatTime(minutes) {
    if (minutes < 60) {
        return minutes + 'm';
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins === 0 ? hours + 'h' : hours + 'h ' + mins + 'm';
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
