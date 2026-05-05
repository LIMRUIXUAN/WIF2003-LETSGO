/* ═══════════════════════════════════════════════════════════
   auth.js  —  Owner: Cha Zi Yu
   Form validation & LocalStorage mock sessions
   Used by: login.html, register.html
   ═══════════════════════════════════════════════════════════ */

'use strict';

// File: public/js/auth.js

async function doLogin() {
    // 1. Grab the values from the HTML inputs
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPw').value;

    const btn = document.querySelector('.btn-eco');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Processing...';

    try {
        // 2. Send the data to your Node.js server
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: password })
        });

        const result = await response.json();

        if (result.success) {
            // 3. THE CRITICAL HANDSHAKE: Save the user's identity to the browser!
            // This is what Explore.js and Favorites.js will look for.
            localStorage.setItem('ecoUserEmail', result.email);
            localStorage.setItem('ecoUserName', result.name);
            localStorage.setItem('isLoggedIn', 'true');

            // Show success and redirect to explore.html
            if (typeof showToast === 'function') showToast(`Welcome back, ${result.name}! 🌿`);
            setTimeout(() => {
                window.location.href = 'explore.html'; 
            }, 800);

        } else {
            // If the got "Invalid password" backend, popup the warning
            showToast('Please enter your credentials ⚠️', 'warn');
            return;
        }

    } catch (error) {
        console.error("Fetch error during login:", error);
        alert("Failed to connect to the server. Is Node.js running?");
    }
}

// ── 2. REGISTER FUNCTION ──
async function doRegister() {
    // Grab values
    const name  = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password    = document.getElementById('regPw').value;

    // Frontend Validation
    if (!name || !email || !password) { 
        if (typeof showToast === 'function') showToast('Please fill in all fields ⚠️', 'warn'); 
        return; 
    }
    if (password.length < 8) { 
        if (typeof showToast === 'function') showToast('Password must be at least 8 characters ⚠️', 'warn'); 
        return; 
    }

    // Client-side email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast('Please enter a valid email format.', 'warn');
        return;
    }

    const btn = document.querySelector('.btn-eco');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Processing...';

    try {
        // Send the data to your Node.js backend
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name, email: email, password: password })
        });

        const result = await response.json();

        if (result.success) {
            // Success! Send them to the login page to sign in
            if (typeof showToast === 'function') showToast('Account created! Please Sign In 🌿');
            setTimeout(() => {
                window.location.href = 'login.html'; // Assuming Cha Zi Yu named it login.html
            }, 1200);
        } else {
            // Usually hits if email is already registered
            if (typeof showToast === 'function') showToast(result.message + ' ⚠️', 'error');
            else alert(result.message);
        }
    } catch (error) {
        console.error("Registration error:", error);
        alert("Failed to connect to the server.");
    }
}

// ── 3. ENTER KEY SUPPORT ──
// Allows users to submit forms by pressing Enter instead of clicking the button
document.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        if (window.location.pathname.includes('login.html')) doLogin();
        if (window.location.pathname.includes('register.html')) doRegister();
    }
});