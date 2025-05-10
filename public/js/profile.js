document.addEventListener('DOMContentLoaded', () => {
    const profileView = document.querySelector('.profile-view');
    const profileEdit = document.querySelector('.profile-edit');
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const profileForm = document.getElementById('profile-form');
    const profileImageInput = document.getElementById('profile-image');
    const profilePreview = document.getElementById('profile-preview');
    const removeImageBtn = document.getElementById('remove-image');
    const logoutBtn = document.getElementById('logout');
  
    // Fetch and display profile
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('JWT Token:', token);
        if (!token) {
          console.log('No token found, redirecting to login');
          window.location.href = '/login';
          return;
        }
  
        console.log('Fetching profile with token:', token);
        const response = await fetch('/api/users/profile', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
  
        console.log('Profile API Response Status:', response.status);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch profile: ${errorText}`);
        }
  
        const user = await response.json();
        console.log('Profile data:', user);
        document.getElementById('username-view').textContent = user.username || 'Unknown';
        document.getElementById('email-view').textContent = user.email || 'Unknown';
        document.getElementById('birth-date-view').textContent = user.birthDate
          ? new Date(user.birthDate).toLocaleDateString()
          : 'Not set';
        document.getElementById('interests-view').textContent = user.interests?.join(', ') || 'None';
        document.getElementById('profile-image-view').src = user.profileImage || 'https://via.placeholder.com/100';
  
        // Pre-fill edit form
        document.getElementById('username').value = user.username || '';
        document.getElementById('birth-date').value = user.birthDate
          ? new Date(user.birthDate).toISOString().split('T')[0]
          : '';
        document.getElementById('interests').value = user.interests?.join(', ') || '';
        profilePreview.src = user.profileImage || 'https://via.placeholder.com/100';
      } catch (error) {
        console.error('Error fetching profile:', error);
        alert(`Failed to load profile: ${error.message}`);
        if (error.message.includes('No token') || error.message.includes('Token is not valid')) {
          window.location.href = '/login';
        }
      }
    };
  
    // Toggle edit mode
    editProfileBtn.addEventListener('click', () => {
      profileView.style.display = 'none';
      profileEdit.style.display = 'block';
    });
  
    cancelEditBtn.addEventListener('click', () => {
      profileEdit.style.display = 'none';
      profileView.style.display = 'block';
      fetchProfile();
    });
  
    // Handle profile image preview
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
  
    // Handle form submission
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(profileForm);
      const token = localStorage.getItem('token');
  
      try {
        const response = await fetch('/api/users/profile', {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        });
  
        const data = await response.json();
        if (response.ok) {
          alert('Profile updated successfully');
          profileEdit.style.display = 'none';
          profileView.style.display = 'block';
          fetchProfile();
          window.updateNavigation();
        } else {
          alert(data.message);
        }
      } catch (error) {
        alert('Error updating profile');
      }
    });
  
    // Handle logout
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      window.updateNavigation();
      window.location.href = '/login';
    });
  
    // Toggle password visibility
    const togglePassword = document.querySelector('.toggle-password');
    togglePassword.addEventListener('click', () => {
      const input = togglePassword.previousElementSibling;
      input.type = input.type === 'password' ? 'text' : 'password';
      togglePassword.classList.toggle('fa-eye');
      togglePassword.classList.toggle('fa-eye-slash');
    });
  
    // Initial fetch
    fetchProfile();
  });