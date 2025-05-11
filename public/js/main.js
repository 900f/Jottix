document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu toggle
    const menuToggle = document.getElementById('mobile-menu');
    const navMenu = document.querySelector('.nav-menu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
    }

    // Dynamic navigation based on authentication
    window.updateNavigation = () => {
        const token = localStorage.getItem('token');
        const authButtons = document.querySelector('.auth-buttons');
        const profileButtons = document.querySelector('.profile-buttons');
        const logoutBtn = document.getElementById('logout');
        const joinNowButton = document.getElementById('join-now'); // "Join Now" button
        const ctaButton = document.getElementById('cta-button'); // "Create Account" button in CTA section

        console.log('updateNavigation, token:', token ? 'Present' : 'Missing');

        if (authButtons && profileButtons) {
            if (token) {
                authButtons.style.display = 'none';
                profileButtons.style.display = 'block';
                
                // Update "Join Now" button to "Post Blog"
                if (joinNowButton) {
                    joinNowButton.textContent = 'Post Blog';
                    joinNowButton.setAttribute('href', 'create-post.html');
                }
                
                // Update "Create Account" button to "Post Blog" in CTA section
                if (ctaButton) {
                    ctaButton.textContent = 'Post Blog';
                    ctaButton.setAttribute('href', 'create-post.html');
                }
            } else {
                authButtons.style.display = 'block';
                profileButtons.style.display = 'none';
                
                // Reset "Join Now" button to default "Join Now"
                if (joinNowButton) {
                    joinNowButton.textContent = 'Join Now';
                    joinNowButton.setAttribute('href', 'signup.html');
                }
                
                // Reset "Create Account" button to default "Create Account"
                if (ctaButton) {
                    ctaButton.textContent = 'Create Account';
                    ctaButton.setAttribute('href', 'signup.html');
                }
            }
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                console.log('Logout clicked, clearing token');
                localStorage.removeItem('token');
                window.updateNavigation();
                window.location.href = '/login.html';
            });
        }
    };

    window.updateNavigation();

});
