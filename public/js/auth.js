document.addEventListener('DOMContentLoaded', () => {
    // Update navigation based on authentication
    const updateNavigation = () => {
      const token = localStorage.getItem('token');
      const authButtons = document.querySelector('.auth-buttons');
      const profileButtons = document.querySelector('.profile-buttons');
      const logoutBtn = document.getElementById('logout');
      const joinNowBtn = document.getElementById('join-now');
  
      if (token) {
        authButtons.style.display = 'none';
        profileButtons.style.display = 'block';
        if (joinNowBtn) {
          joinNowBtn.textContent = 'Publish Blog';
          joinNowBtn.href = '/create-post';
        }
      } else {
        authButtons.style.display = 'block';
        profileButtons.style.display = 'none';
        if (joinNowBtn) {
          joinNowBtn.textContent = 'Join Now';
          joinNowBtn.href = '/signup';
        }
      }
  
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          localStorage.removeItem('token');
          updateNavigation();
          window.location.href = '/login';
        });
      }
    };
  
    // Signup form handling
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
      const profileImageInput = document.getElementById('profile-image');
      const profilePreview = document.getElementById('profile-preview');
      const removeImageBtn = document.getElementById('remove-image');
  
      profileImageInput.addEventListener('change', () => {
        const file = profileImageInput.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            profilePreview.src = reader.result;
          };
          reader.readAsDataURL(file);
        }
      });
  
      removeImageBtn.addEventListener('click', () => {
        profileImageInput.value = '';
        profilePreview.src = 'https://via.placeholder.com/100';
      });
  
      signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(signupForm);
  
        // Log FormData contents
        const formDataEntries = {};
        for (const [key, value] of formData.entries()) {
          formDataEntries[key] = value instanceof File ? `File: ${value.name}` : value;
        }
        console.log('FormData sent:', formDataEntries);
  
        try {
          const response = await fetch('/api/auth/signup', {
            method: 'POST',
            body: formData,
          });
  
          let data;
          const text = await response.text();
          try {
            data = JSON.parse(text);
          } catch (jsonError) {
            console.error('Failed to parse JSON:', jsonError);
            console.error('Response text:', text.substring(0, 200));
            throw new Error('Server returned an invalid response');
          }
  
          if (response.ok) {
            console.log('Signup successful, setting token:', data.token);
            localStorage.setItem('token', data.token);
            updateNavigation();
            window.location.href = '/explore';
          } else {
            console.log('Signup error:', data);
            alert(data.message || 'Error signing up');
          }
        } catch (error) {
          console.error('Error signing up:', error);
          alert('Error signing up: ' + error.message);
        }
      });
    }
  
    // Login form handling
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(loginForm);
        const data = Object.fromEntries(formData);
  
        try {
          console.log('Sending login request:', data);
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
  
          const result = await response.json();
          console.log('Login response:', result);
          if (response.ok) {
            console.log('Login successful, setting token:', result.token);
            localStorage.setItem('token', result.token);
            updateNavigation();
            window.location.href = '/explore';
          } else {
            console.log('Login error:', result);
            alert(result.message || 'Error logging in');
          }
        } catch (error) {
          console.error('Error logging in:', error);
          alert('Error logging in: ' + error.message);
        }
      });
    }
  
    // Toggle password visibility
    const togglePassword = document.querySelectorAll('.toggle-password');
    togglePassword.forEach(toggle => {
      toggle.addEventListener('click', () => {
        const input = toggle.previousElementSibling;
        input.type = input.type === 'password' ? 'text' : 'password';
        toggle.classList.toggle('fa-eye');
        toggle.classList.toggle('fa-eye-slash');
      });
    });
  
    // Initial navigation update
    updateNavigation();
  });