document.addEventListener('DOMContentLoaded', () => {
  const profileView = document.querySelector('.profile-view');
  const profileEdit = document.querySelector('.profile-edit');
  const editProfileBtn = document.getElementById('edit-profile-btn');
  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  const profileForm = document.getElementById('profile-form');
  const profileImageInput = document.getElementById('profile-image');
  const coverImageInput = document.getElementById('cover-image');
  const profilePreview = document.getElementById('profile-preview');
  const coverPreview = document.getElementById('cover-preview');
  const removeImageBtn = document.getElementById('remove-image');
  const removeCoverImageBtn = document.getElementById('remove-cover-image');
  const logoutBtn = document.getElementById('logout');

  // Fetch and display posts
  const fetchPosts = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found for posts fetch');
        throw new Error('No token found');
      }

      console.log('Fetching posts for user:', userId);
      const response = await fetch(`/api/posts/user/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      console.log('Posts API Response:', { status: response.status, statusText: response.statusText });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Posts API Error Response:', errorText);
        throw new Error(`Failed to fetch posts: ${errorText}`);
      }

      const posts = await response.json();
      console.log('Posts data:', posts);
      const postGrid = document.querySelector('.post-grid');
      postGrid.innerHTML = '';

      if (posts.length === 0) {
        postGrid.innerHTML = '<p class="post-grid-empty">No posts yet.</p>';
        return;
      }

      posts.forEach(post => {
        const postCard = document.createElement('div');
        postCard.className = 'post-card';
        const imageHtml = post.image && post.image !== 'https://i.imgur.com/U0y5ne8.jpeg'
          ? `<img src="${post.image}" alt="${post.title}" class="post-image">`
          : '';
        postCard.innerHTML = `
          <a href="/post.html?id=${post._id}">
            ${imageHtml}
            <div class="post-content">
              <p class="post-username">@${post.user.username}</p>
              <h3 class="post-title">${post.title}</h3>
              <p class="post-excerpt">${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}</p>
              <span class="post-category">${post.category}</span>
              <div class="post-tags">
                ${post.tags.map(tag => `<span class="post-tag">${tag}</span>`).join('')}
              </div>
              <div class="post-meta">
                <p class="post-date">${new Date(post.createdAt).toLocaleDateString()}</p>
                <p class="post-likes">${post.likes.length} likes</p>
              </div>
            </div>
          </a>
        `;
        postGrid.appendChild(postCard);
      });
    } catch (error) {
      console.error('Error fetching posts:', error);
      const postGrid = document.querySelector('.post-grid');
      postGrid.innerHTML = '<p class="post-grid-empty">Failed to load posts.</p>';
    }
  };

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
      document.getElementById('bio-view').textContent = user.bio || '';
      document.getElementById('profile-image-view').src = user.profileImage || '/images/default-avatar.png';
      document.getElementById('cover-image-view').src = user.coverImage || '/images/default-cover.jpg';
      document.getElementById('posts-count').textContent = user.postsCount || 0;
      document.getElementById('followers-count').textContent = user.followersCount || 0;
      document.getElementById('following-count').textContent = user.followingCount || 0;

      // Social links
      const instagramLink = document.getElementById('instagram-link');
      const twitterLink = document.getElementById('twitter-link');
      const tiktokLink = document.getElementById('tiktok-link');
      if (user.instagram) {
        instagramLink.href = user.instagram;
        instagramLink.style.display = 'inline';
      }
      if (user.twitter) {
        twitterLink.href = user.twitter;
        twitterLink.style.display = 'inline';
      }
      if (user.tiktok) {
        tiktokLink.href = user.tiktok;
        tiktokLink.style.display = 'inline';
      }

      // Pre-fill edit form
      document.getElementById('username').value = user.username || '';
      document.getElementById('birth-date').value = user.birthDate
        ? new Date(user.birthDate).toISOString().split('T')[0]
        : '';
      document.getElementById('bio').value = user.bio || '';
      document.getElementById('interests').value = user.interests?.join(', ') || '';
      document.getElementById('instagram').value = user.instagram || '';
      document.getElementById('twitter').value = user.twitter || '';
      document.getElementById('tiktok').value = user.tiktok || '';
      profilePreview.src = user.profileImage || '/images/default-avatar.png';
      coverPreview.src = user.coverImage || '/images/default-cover.jpg';

      // Fetch posts after profile data
      await fetchPosts(user._id);
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

  // Handle cover image preview
  coverImageInput.addEventListener('change', () => {
    const file = coverImageInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        coverPreview.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  });

  // Remove images
  removeImageBtn.addEventListener('click', () => {
    profileImageInput.value = '';
    profilePreview.src = '/images/default-avatar.png';
  });

  removeCoverImageBtn.addEventListener('click', () => {
    coverImageInput.value = '';
    coverPreview.src = '/images/default-cover.jpg';
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

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update profile: ${errorText}`);
      }

      const data = await response.json();
      alert('Profile updated successfully');
      profileEdit.style.display = 'none';
      profileView.style.display = 'block';
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(`Failed to update profile: ${error.message}`);
    }
  });

  // Handle logout
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  });

  // Toggle password visibility
  const togglePassword = document.querySelector('.toggle-password');
  if (togglePassword) {
    togglePassword.addEventListener('click', () => {
      const passwordInput = document.getElementById('password');
      const type = passwordInput.type === 'password' ? 'text' : 'password';
      passwordInput.type = type;
      togglePassword.classList.toggle('fa-eye');
      togglePassword.classList.toggle('fa-eye-slash');
    });
  }

  // Initial fetch
  fetchProfile();
});