document.addEventListener('DOMContentLoaded', () => {
    const postGrid = document.querySelector('.post-grid');
    const userGrid = document.querySelector('.user-grid');
    const userResultsSection = document.querySelector('.user-results');
    const pagination = document.querySelector('.pagination');
    const searchForm = document.querySelector('.search-form');
    const searchInput = document.querySelector('.search-input');
    const filterTags = document.querySelectorAll('.filter-tag');
    const postModal = document.getElementById('post-modal');
    const modalBody = document.getElementById('modal-body');
    const closeButton = document.querySelector('.close-button');
    let currentPage = 1;
    const postsPerPage = 9;
    let currentCategory = 'All';
    let currentSearch = '';
    let currentSort = 'latest';

    const urlParams = new URLSearchParams(window.location.search);
    const categoryFromUrl = urlParams.get('category');
    if (categoryFromUrl) currentCategory = categoryFromUrl;

    function updateActiveFilterTag(category) {
        filterTags.forEach(tag => {
            tag.classList.remove('active');
            if (tag.textContent.trim().toLowerCase() === category.toLowerCase()) {
                tag.classList.add('active');
            }
        });
    }

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
            renderPosts(data.posts);
            renderPagination(data.totalPages);
            updateActiveFilterTag(currentCategory);
        } catch (error) {
            console.error('Error fetching posts:', error.message);
            postGrid.innerHTML = '<p>Error loading posts. Please try again later.</p>';
        }
    }

    async function fetchUsers(searchTerm) {
        try {
            if (!searchTerm) {
                userResultsSection.style.display = 'none';
                userGrid.innerHTML = '';
                return;
            }

            const response = await fetch(`/api/users/search?query=${encodeURIComponent(searchTerm)}`);
            if (!response.ok) throw new Error('Failed to fetch users');
            const users = await response.json();
            renderUsers(users);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    }

    function renderPosts(posts) {
        postGrid.innerHTML = '';
        posts.forEach(post => {
            const postCard = document.createElement('div');
            postCard.className = 'post-card';

            const createdAt = new Date(post.createdAt).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
            });

            const previewContent = post.content.substring(0, 100).replace(/\n/g, '<br>');
            const ellipsis = post.content.length > 100 ? '...' : '';

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
                            <span class="author-name">${post.user.username}</span>
                        </div>
                        <span class="post-date">${createdAt}</span>
                    </div>
                    <p>${previewContent}${ellipsis}</p>
                    <a href="#" class="read-more" data-id="${post._id}">Read More</a>
                </div>
            `;
            postGrid.appendChild(postCard);
        });

        document.querySelectorAll('.read-more').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const postId = button.getAttribute('data-id');
                openModal(postId);
            });
        });
    }

    function renderUsers(users) {
        userGrid.innerHTML = '';
        userResultsSection.style.display = users.length ? 'block' : 'none';

        users.forEach(user => {
            const userCard = document.createElement('div');
            userCard.className = 'user-card';
            userCard.innerHTML = `
                <div class="user-avatar">
                    <img src="${user.profileImage || 'https://placehold.co/60x60'}" alt="${user.username}">
                </div>
                <div class="user-info">
                    <h3>${user.username}</h3>
                    <p>${user.bio || 'No bio available.'}</p>
                    <a href="/profile.html?userId=${user._id}" class="btn btn-outline">View Profile</a>
                </div>
            `;
            userGrid.appendChild(userCard);
        });
    }

    function openModal(postId) {
        fetch(`/api/posts/${postId}`)
            .then(response => response.json())
            .then(post => {
                const createdAt = new Date(post.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                });
                const formattedContent = post.content.replace(/\n/g, '<br>');

                modalBody.innerHTML = `
                    <h2>${post.title}</h2>
                    <div class="post-meta">
                        <div class="author">
                            <div class="author-avatar">
                                <img src="${post.user.profileImage || 'https://placehold.co/30x30'}" alt="${post.user.username}">
                            </div>
                            <span class="author-name">${post.user.username}</span>
                        </div>
                        <span class="post-date">${createdAt}</span>
                    </div>
                    <p>${formattedContent}</p>
                `;
                postModal.classList.remove('hidden');
            })
            .catch(err => console.error('Error fetching post details:', err));
    }

    closeButton.addEventListener('click', () => {
        postModal.classList.add('hidden');
    });

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
            fetchUsers(currentSearch);
        });
    }

    filterTags.forEach(tag => {
        tag.addEventListener('click', () => {
            filterTags.forEach(t => t.classList.remove('active'));
            tag.classList.add('active');
            currentCategory = tag.textContent === 'All' ? 'All' : tag.textContent.trim().toLowerCase();
            if (tag.textContent === 'Latest') currentSort = 'latest';
            if (tag.textContent === 'Popular') currentSort = 'oldest';
            currentPage = 1;

            const newUrl = new URL(window.location);
            newUrl.searchParams.set('category', currentCategory);
            history.pushState({}, '', newUrl);

            fetchPosts();
        });
    });

    fetchPosts();
});
