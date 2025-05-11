document.addEventListener('DOMContentLoaded', () => {
    const postGrid = document.querySelector('.post-grid');
    const pagination = document.querySelector('.pagination');
    const searchForm = document.querySelector('.search-form');
    const searchInput = document.querySelector('.search-input');
    const filterTags = document.querySelectorAll('.filter-tag');
    const postModal = document.getElementById('post-modal');
    const modalBody = document.getElementById('modal-body');
    const closeButton = document.querySelector('.close-button');
    let currentPage = 1;
    const postsPerPage = 9;
    let currentCategory = 'All'; // Default category is 'All'
    let currentSearch = '';
    let currentSort = 'latest';

    // Get category from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const categoryFromUrl = urlParams.get('category');
    if (categoryFromUrl) {
        currentCategory = categoryFromUrl;
    }

    // Function to update the active filter tag
    function updateActiveFilterTag(category) {
        filterTags.forEach(tag => {
            tag.classList.remove('active');  // Remove active class from all tags
            if (tag.textContent.trim().toLowerCase() === category.toLowerCase()) {
                tag.classList.add('active');  // Add active class to the selected category
            }
        });
    }

    // Initial fetch of posts based on category
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

            updateActiveFilterTag(currentCategory); // Update the active category based on the URL parameter
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
            
            // Format the createdAt date to a readable format
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
                        <!-- Username and Date -->
                        <div class="author">
                            <div class="author-avatar">
                                <img src="${post.user.profileImage || 'https://placehold.co/30x30'}" alt="${post.user.username}">
                            </div>
                            <span class="author-name">${post.user.username}</span> <!-- Display the username -->
                        </div>
                        <span class="post-date">${createdAt}</span> <!-- Display the date -->
                    </div>
                    <p>${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}</p>
                    <a href="#" class="read-more" data-id="${post._id}">Read More</a>
                </div>
            `;
            postGrid.appendChild(postCard);
        });

        // Add event listener for the "Read More" buttons
        document.querySelectorAll('.read-more').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const postId = button.getAttribute('data-id');
                openModal(postId);
            });
        });
    }

    // Function to open modal with post details
    function openModal(postId) {
        fetch(`/api/posts/${postId}`)
            .then(response => response.json())
            .then(post => {
                // Format the createdAt date to a readable format
                const createdAt = new Date(post.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                });

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
                    <p>${post.content}</p>
                `;
                postModal.classList.remove('hidden');
            })
            .catch(err => console.error('Error fetching post details:', err));
    }

    // Close the modal when clicking the close button
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
            
            // Update the URL with the selected category without reloading the page
            const newUrl = new URL(window.location);
            newUrl.searchParams.set('category', currentCategory);
            history.pushState({}, '', newUrl);  // Change URL without reloading page

            fetchPosts();
        });
    });

    // Initial fetch of posts
    fetchPosts();
});
