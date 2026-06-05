/* ═══════════════════════════════════════════════════════════
   auth.js  —  Owner: Cha Zi Yu
   Form validation & LocalStorage mock sessions
   Used by: login.html, register.html, reset-password.html
   ═══════════════════════════════════════════════════════════ */

'use strict';

async function doLogin() {
    // 1. Grab the values from the HTML inputs
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPw').value;

    const btn = document.querySelector('.btn-eco');
    const originalBtnHtml = btn.innerHTML;
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
            localStorage.setItem('ecoAuthToken', result.token);
            localStorage.removeItem('ecoUserInitials');

            // Show success and redirect to explore.html
            if (typeof showToast === 'function') showToast(`Welcome back, ${result.name}! 🌿`);
            setTimeout(() => {
                window.location.href = getLoginRedirectTarget();
            }, 800);

        } else {
            // If the got "Invalid password" backend, popup the warning
            showToast('Please enter your credentials ⚠️', 'warn');
            return;
        }

    } catch (error) {
        console.error("Fetch error during login:", error);
        alert("Failed to connect to the server. Is Node.js running?");
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalBtnHtml;
    }
}

async function doRegister() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const password = document.getElementById('regPw').value;
    const confirmPassword = document.getElementById('regConfirmPw').value;

    if (!name || !email || !password || !confirmPassword) {
        showToast('Please fill in all fields.', 'warn');
        return;
    }

    if (password.length < 8) {
        showToast('Password must be at least 8 characters.', 'warn');
        return;
    }

    if (password !== confirmPassword) {
        showToast('Passwords do not match.', 'warn');
        return;
    }

    const btn = document.querySelector('.btn-eco');
    const originalBtnHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Processing...';

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const result = await response.json();

        if (result.success) {
            showToast('Account created successfully! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1200);
        } else {
            showToast(result.message || 'Registration failed.', 'error');
        }
    } catch (error) {
        console.error("Fetch error during registration:", error);
        showToast('Failed to connect to the server.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalBtnHtml;
    }
}

function getLoginRedirectTarget() {
    const requested = new URLSearchParams(window.location.search).get('redirect');
    if (!requested) return 'explore.html';

    try {
        const target = new URL(requested, window.location.origin);
        if (target.origin !== window.location.origin) return 'explore.html';
        if (target.pathname.endsWith('/login.html')) return 'explore.html';
        return `${target.pathname}${target.search}${target.hash}`;
    } catch (_error) {
        return 'explore.html';
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

    let requestSuccessful = false;

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

        requestSuccessful = true;
        showToast(`Code sent. Check your email within ${result.expiresInMinutes || 10} minutes.`, 'info');
        
        // Reveal the hidden fields with a smooth fade in
        const hiddenFields = document.getElementById('resetHiddenFields');
        if(hiddenFields) {
            hiddenFields.style.display = 'block';
            setTimeout(() => { hiddenFields.style.opacity = '1'; }, 50);
            
            // Auto-focus the first digit input
            const firstDigit = document.querySelector('.reset-digit');
            if(firstDigit) firstDigit.focus();
        } else {
            // Fallback for older HTML structure
            const oldInput = document.getElementById('resetCode');
            if(oldInput && oldInput.type !== 'hidden') oldInput.focus();
        }
    } catch (error) {
        console.error("Password reset code request error:", error);
        showToast('Failed to connect to the server.', 'error');
    } finally {
        if (!requestSuccessful) {
            btn.disabled = false;
            btn.innerHTML = 'Send Code';
        } else {
            // Start 60-second cooldown timer to prevent spamming
            let timeLeft = 60;
            btn.innerHTML = `Wait ${timeLeft}s`;
            const timer = setInterval(() => {
                timeLeft--;
                if (timeLeft <= 0) {
                    clearInterval(timer);
                    btn.disabled = false;
                    btn.innerHTML = 'Send Code';
                } else {
                    btn.innerHTML = `Wait ${timeLeft}s`;
                }
            }, 1000);
        }
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

// ── 4. OTP AUTO-TABBING (For Reset Password) ──
document.addEventListener('DOMContentLoaded', () => {
    const digits = document.querySelectorAll('.reset-digit');
    if (digits.length === 0) return;

    digits.forEach((digit, index) => {
        digit.addEventListener('input', (e) => {
            const val = e.target.value;
            // Ensure only numbers are entered
            if (!/^\d$/.test(val)) {
                e.target.value = '';
                return;
            }
            // Move to next input
            if (val && index < digits.length - 1) {
                digits[index + 1].focus();
            }
            // Update hidden full code input
            updateHiddenResetCode();
        });

        digit.addEventListener('keydown', (e) => {
            // Handle backspace to go to previous input
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                digits[index - 1].focus();
            }
            // Handle left/right arrow navigation
            if (e.key === 'ArrowLeft' && index > 0) {
                digits[index - 1].focus();
            }
            if (e.key === 'ArrowRight' && index < digits.length - 1) {
                digits[index + 1].focus();
            }
        });
        
        // Paste support
        digit.addEventListener('paste', (e) => {
            e.preventDefault();
            const pastedData = (e.clipboardData || window.clipboardData).getData('text').trim();
            if (!/^\d+$/.test(pastedData)) return; // ensure only digits
            
            const chars = pastedData.split('').slice(0, digits.length);
            chars.forEach((char, i) => {
                if (index + i < digits.length) {
                    digits[index + i].value = char;
                }
            });
            // Focus the correct box after pasting
            const focusIndex = Math.min(index + chars.length, digits.length - 1);
            digits[focusIndex].focus();
            updateHiddenResetCode();
        });
    });

    function updateHiddenResetCode() {
        const hiddenInput = document.getElementById('resetCode');
        if (hiddenInput) {
            let fullCode = '';
            digits.forEach(d => fullCode += d.value);
            hiddenInput.value = fullCode;
        }
    }
});
