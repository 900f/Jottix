document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu toggle
    const menuToggle = document.getElementById('mobile-menu');
    const navMenu = document.querySelector('.nav-menu');
  
    menuToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      menuToggle.classList.toggle('active');
    });
  
    // Dynamic navigation based on authentication
    window.updateNavigation = () => {
      const token = localStorage.getItem('token');
      const authButtons = document.querySelector('.auth-buttons');
      const profileButtons = document.querySelector('.profile-buttons');
      const logoutBtn = document.getElementById('logout');
  
      console.log('updateNavigation, token:', token ? 'Present' : 'Missing');
  
      if (token) {
        authButtons.style.display = 'none';
        profileButtons.style.display = 'block';
      } else {
        authButtons.style.display = 'block';
        profileButtons.style.display = 'none';
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
  
    // Fetch posts for explore page
    if (window.location.pathname.includes('explore.html')) {
      const postGrid = document.querySelector('.post-grid');
      const filters = document.querySelectorAll('.filter-tag');
      const searchForm = document.getElementById('search-form');
      const searchInput = document.getElementById('search-input');
      let currentFilter = 'All';
      let currentSearch = '';
  
      const fetchPosts = async (category = '', search = '', sort = 'latest') => {
        try {
          const query = new URLSearchParams();
          if (category && category !== 'All') query.set('category', category);
          if (search) query.set('search', search);
          query.set('sort', sort);
  
          console.log('Fetching posts:', query.toString());
          const response = await fetch(`/api/posts?${query.toString()}`);
          const { posts, users } = await response.json();
  
          postGrid.innerHTML = '';
          // Display posts
          if (posts.length) {
            posts.forEach(post => {
              const postCard = document.createElement('div');
              postCard.className = 'post-card';
              postCard.innerHTML = `
                <div class="post-image">
                  ${post.image ? `<img src="${post.image}" alt="Post image">` : '<div class="no-image">No Image</div>'}
                  <span class="category ${post.category.toLowerCase()}">${post.category}</span>
                </div>
                <div class="post-content">
                  <h3>${post.title}</h3>
                  <div class="post-meta">
                    <div class="author">
                      <div class="author-avatar">
                        <img src="${post.user.profileImage || '/images/default-avatar.png'}" alt="${post.user.username}">
                      </div>
                      <span>${post.user.username}</span>
                    </div>
                    <span>${new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p>${post.content.substring(0, 100)}...</p>
                  <a href="#" class="read-more">Read More</a>
                </div>
              `;
              postGrid.appendChild(postCard);
            });
          }
          // Display users
          if (users.length) {
            users.forEach(user => {
              const userCard = document.createElement('div');
              userCard.className = 'post-card';
              userCard.innerHTML = `
                <div class="post-image">
                  <div class="no-image">User Profile</div>
                </div>
                <div class="post-content">
                  <h3>${user.username}</h3>
                  <div class="post-meta">
                    <div class="author">
                      <div class="author-avatar">
                        <img src="${user.profileImage || '/images/default-avatar.png'}" alt="${user.username}">
                      </div>
                      <span>User</span>
                    </div>
                  </div>
                  <p>View ${user.username}'s profile and posts.</p>
                  <a href="/profile.html?userId=${user._id}" class="read-more">View Profile</a>
                </div>
              `;
              postGrid.appendChild(userCard);
            });
          }
          if (!posts.length && !users.length) {
            postGrid.innerHTML = '<p>No results found.</p>';
          }
        } catch (error) {
          console.error('Error fetching posts:', error);
          postGrid.innerHTML = '<p>Error loading results.</p>';
        }
      };
  
      // Category filters
      filters.forEach(filter => {
        filter.addEventListener('click', () => {
          filters.forEach(f => f.classList.remove('active'));
          filter.classList.add('active');
          currentFilter = filter.textContent;
          fetchPosts(currentFilter === 'All' ? '' : currentFilter, currentSearch);
        });
      });
  
      // Search form
      if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
          e.preventDefault();
          currentSearch = searchInput.value.trim();
          fetchPosts(currentFilter === 'All' ? '' : currentFilter, currentSearch);
        });
      }
  
      fetchPosts();
    }
  
    // Fetch categories for categories page
    if (window.location.pathname.includes('categories.html')) {
      const categoryGrid = document.querySelector('.category-blocks-grid');
  
      const fetchCategories = async () => {
        try {
          const response = await fetch('/api/categories');
          const categories = await response.json();
  
          categoryGrid.innerHTML = '';
          categories.forEach(category => {
            const categoryBlock = document.createElement('div');
            categoryBlock.className = 'category-block';
            categoryBlock.innerHTML = `
              <a href="/category.html?category=${encodeURIComponent(category.name)}">
                <div class="category-block-image">
                  <img src="/images/categories/${category.name.toLowerCase()}.jpg" alt="${category.name} category" onerror="this.src='/images/default-category.jpg'">
                </div>
                <div class="category-block-content">
                  <h3>${category.name}</h3>
                  <p class="category-count">${category.count} posts</p>
                </div>
              </a>
            `;
            categoryGrid.appendChild(categoryBlock);
          });
        } catch (error) {
          console.error('Error fetching categories:', error);
          categoryGrid.innerHTML = '<p>Error loading categories.</p>';
        }
      };
  
      fetchCategories();
    }
  
    // Fetch posts for category page
    if (window.location.pathname.includes('category.html')) {
      const postGrid = document.querySelector('.post-grid');
      const categoryTitle = document.querySelector('.category-title');
  
      const fetchCategoryPosts = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('category');
  
        if (category) {
          categoryTitle.textContent = `${category} Posts`;
          try {
            const response = await fetch(`/api/posts?category=${encodeURIComponent(category)}`);
            const { posts } = await response.json();
  
            postGrid.innerHTML = '';
            if (posts.length) {
              posts.forEach(post => {
                const postCard = document.createElement('div');
                postCard.className = 'post-card';
                postCard.innerHTML = `
                  <div class="post-image">
                    ${post.image ? `<img src="${post.image}" alt="Post image">` : '<div class="no-image">No Image</div>'}
                    <span class="category ${post.category.toLowerCase()}">${post.category}</span>
                  </div>
                  <div class="post-content">
                    <h3>${post.title}</h3>
                    <div class="post-meta">
                      <div class="author">
                        <div class="author-avatar">
                          <img src="${post.user.profileImage || '/images/default-avatar.png'}" alt="${post.user.username}">
                        </div>
                        <span>${post.user.username}</span>
                      </div>
                      <span>${new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p>${post.content.substring(0, 100)}...</p>
                    <a href="#" class="read-more">Read More</a>
                  </div>
                `;
                postGrid.appendChild(postCard);
              });
            } else {
              postGrid.innerHTML = '<p>No posts found in this category.</p>';
            }
          } catch (error) {
            console.error('Error fetching category posts:', error);
            postGrid.innerHTML = '<p>Error loading posts.</p>';
          }
        } else {
          postGrid.innerHTML = '<p>Invalid category.</p>';
        }
      };
  
      fetchCategoryPosts();
    }
  });