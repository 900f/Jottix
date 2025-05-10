document.addEventListener('DOMContentLoaded', () => {
    const postGrid = document.querySelector('.post-grid');
    const pagination = document.querySelector('.pagination');
    const searchForm = document.querySelector('.search-form');
    const searchInput = document.querySelector('.search-input');
    const filterTags = document.querySelectorAll('.filter-tag');
    let currentPage = 1;
    const postsPerPage = 9;
    let currentCategory = 'All';
    let currentSearch = '';
    let currentSort = 'latest';
  
    async function fetchPosts(page = 1) {
      try {
        const params = new URLSearchParams({
          page,
          limit: postsPerPage,
          sort: currentSort,
        });
        if (currentCategory !== 'All') params.append('category', currentCategory);
        if (currentSearch) params.append('search', currentSearch);
  
        const response = await fetch(`/api/posts?${params.toString()}`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        console.log('Fetched posts:', data.posts);
  
        renderPosts(data.posts);
        renderPagination(data.totalPages);
      } catch (error) {
        console.error('Error fetching posts:', error.message, error.stack);
        postGrid.innerHTML = '<p>Error loading posts. Please try again later.</p>';
      }
    }
  
    function renderPosts(posts) {
      postGrid.innerHTML = '';
      posts.forEach(post => {
        const postCard = document.createElement('div');
        postCard.className = 'post-card';
        const createdAt = new Date(post.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        postCard.innerHTML = `
          <div class="post-image">
            <img src="${post.image || 'https://placehold.co/300x200'}" alt="${post.title}">
            <span class="category ${post.category.toLowerCase()}">${post.category}</span>
          </div>
          <div class="post-content">
            <h3>${post.title}</h3>
            <div class="post-meta">
              <div class="author">
                <div class="author-avatar">
                  <img src="${post.user.profileImage || 'https://placehold.co/30x30'}" alt="${post.user.username}">
                </div>
                <span>${post.user.username}</span>
              </div>
              <span>${createdAt}</span>
            </div>
            <p>${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}</p>
            <a href="#" class="read-more" data-id="${post._id}">Read More</a>
          </div>
        `;
        postGrid.appendChild(postCard);
      });
    }
  
    function renderPagination(totalPages) {
      pagination.innerHTML = '';
      if (totalPages <= 1) return;
  
      const prev = document.createElement('a');
      prev.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
      prev.innerHTML = '<i class="fas fa-chevron-left"></i>';
      if (currentPage > 1) prev.addEventListener('click', () => changePage(currentPage - 1));
      pagination.appendChild(prev);
  
      for (let i = 1; i <= totalPages; i++) {
        const pageItem = document.createElement('a');
        pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageItem.textContent = i;
        pageItem.addEventListener('click', () => changePage(i));
        pagination.appendChild(pageItem);
      }
  
      const next = document.createElement('a');
      next.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
      next.innerHTML = '<i class="fas fa-chevron-right"></i>';
      if (currentPage < totalPages) next.addEventListener('click', () => changePage(currentPage + 1));
      pagination.appendChild(next);
    }
  
    function changePage(page) {
      currentPage = page;
      fetchPosts(page);
    }
  
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        currentSearch = searchInput.value.trim();
        currentPage = 1;
        fetchPosts();
      });
    }
  
    filterTags.forEach(tag => {
      tag.addEventListener('click', () => {
        filterTags.forEach(t => t.classList.remove('active'));
        tag.classList.add('active');
        currentCategory = tag.textContent === 'All' ? 'All' : tag.textContent.replace(' ', '');
        if (tag.textContent === 'Latest') currentSort = 'latest';
        if (tag.textContent === 'Popular') currentSort = 'oldest';
        currentPage = 1;
        fetchPosts();
      });
    });
  
    fetchPosts();
  });
  
  // -------- Post Modal Logic --------
  const modal = document.getElementById('post-modal');
  const modalBody = document.getElementById('modal-body');
  const closeButton = document.querySelector('.close-button');
  
  function getUserIdFromToken(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId;
    } catch (e) {
      return null;
    }
  }
  
  document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('read-more')) {
      e.preventDefault();
      const postId = e.target.dataset.id;
      if (!postId) {
        console.warn('Post ID is undefined.');
        return;
      }
  
      try {
        const res = await fetch(`/api/posts/${postId}`);
        if (!res.ok) throw new Error('Failed to load post');
        const post = await res.json();
        const token = localStorage.getItem('token');
        const userId = getUserIdFromToken(token);
        const isLiked = token && post.likes.includes(userId);
  
        modalBody.innerHTML = `
          <h2>${post.title}</h2>
          <p class="author-info">by ${post.user.username}</p>
          ${post.image ? `<img src="${post.image}" alt="${post.title}">` : ''}
          <p>${post.content}</p>
          <button class="like-button ${isLiked ? 'liked' : ''}" data-id="${post._id}">
            <i class="fas fa-heart"></i> ${post.likes.length}
          </button>
        `;
        modal?.classList.remove('hidden');
      } catch (err) {
        alert('Error loading post.');
      }
    }
  
    if (e.target.closest('.like-button')) {
      const btn = e.target.closest('.like-button');
      const postId = btn.dataset.id;
      const token = localStorage.getItem('token');
  
      if (!token) return alert('Please log in to like posts.');
  
      try {
        const res = await fetch(`/api/posts/${postId}/like`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        btn.classList.toggle('liked', data.liked);
        btn.innerHTML = `<i class="fas fa-heart"></i> ${data.likesCount}`;
      } catch (err) {
        alert('Error updating like.');
      }
    }
  });
  
  if (closeButton) {
    closeButton.addEventListener('click', () => modal?.classList.add('hidden'));
  }
  
  window.addEventListener('click', (e) => {
    if (e.target === modal) modal?.classList.add('hidden');
  });
  