/* ═══════════════════════════════════════════════════════════
   auth.js  —  Owner: Cha Zi Yu
   Form validation & LocalStorage mock sessions
   Used by: login.html, register.html
   ═══════════════════════════════════════════════════════════ */

'use strict';

// File: public/js/auth.jsf

async function doLogin() {
    // 1. Grab the values from the HTML inputs
    const email = document.getElementById('loginEmail').value.trim();
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
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const password = document.getElementById('regPw').value;

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

async function requestPasswordResetCode() {
    const email = document.getElementById('resetEmail').value.trim();
    const btn = document.getElementById('btnSendResetCode');

    if (!email) {
        showToast('Please enter your email first.', 'warn');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast('Please enter a valid email format.', 'warn');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

    try {
        const response = await fetch('/api/auth/password-reset/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const result = await response.json();
        if (!result.success) {
            showToast(result.message || 'Could not send verification code.', 'error');
            return;
        }

        showToast(`Code sent. Check your email within ${result.expiresInMinutes || 10} minutes.`, 'info');
        document.getElementById('resetCode').focus();
    } catch (error) {
        console.error("Password reset code request error:", error);
        showToast('Failed to connect to the server.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Send Code';
    }
}

async function resetPassword() {
    const email = document.getElementById('resetEmail').value.trim();
    const code = document.getElementById('resetCode').value.trim();
    const password = document.getElementById('resetNewPw').value;
    const confirmPassword = document.getElementById('resetConfirmPw').value;
    const btn = document.getElementById('btnResetPassword');

    if (!email || !code || !password || !confirmPassword) {
        showToast('Please fill in all reset fields.', 'warn');
        return;
    }

    if (!/^\d{6}$/.test(code)) {
        showToast('Verification code must be 6 digits.', 'warn');
        return;
    }

    if (password.length < 8) {
        showToast('Password must be at least 8 characters.', 'warn');
        return;
    }

    if (password !== confirmPassword) {
        showToast('The new passwords do not match.', 'warn');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Resetting...';

    try {
        const response = await fetch('/api/auth/password-reset/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code, password })
        });

        const result = await response.json();
        if (!result.success) {
            showToast(result.message || 'Could not reset password.', 'error');
            return;
        }

        showToast('Password reset successfully. Redirecting to sign in...', 'success');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1200);
    } catch (error) {
        console.error("Password reset error:", error);
        showToast('Failed to connect to the server.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-shield-lock"></i> Reset Password';
    }
}

// ── 3. ENTER KEY SUPPORT ──
// Allows users to submit forms by pressing Enter instead of clicking the button
document.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        if (window.location.pathname.includes('login.html')) doLogin();
        if (window.location.pathname.includes('register.html')) doRegister();
        if (window.location.pathname.includes('reset-password.html')) resetPassword();
    }
});
