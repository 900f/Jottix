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

    async function openModal(postId) {
        try {
            const response = await fetch(`/api/posts/${postId}`);
            if (!response.ok) throw new Error('Failed to fetch post');
            const post = await response.json();

            const createdAt = new Date(post.createdAt).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
            });
            const formattedContent = post.content.replace(/\n/g, '<br>');

            // Get logged-in user's ID from JWT
            let currentUserId = null;
            const token = localStorage.getItem('token');
            console.log('JWT Token:', token); // Debug
            if (token) {
                try {
                    const decoded = jwt_decode(token);
                    currentUserId = decoded.userId;
                    console.log('Current User ID:', currentUserId); // Debug
                } catch (error) {
                    console.error('Error decoding JWT:', error.message);
                }
            } else {
                console.log('No JWT token found in localStorage'); // Debug
            }

            // Render comments
            let commentsHtml = '<h3>Comments</h3>';
            if (post.comments && post.comments.length > 0) {
                commentsHtml += '<div class="comments-list">';
                post.comments.forEach(comment => {
                    console.log('Comment User ID:', comment.user._id); // Debug
                    const commentDate = new Date(comment.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric'
                    });
                    const isOwnComment = currentUserId && comment.user._id === currentUserId;
                    console.log('Is Own Comment:', isOwnComment, 'for Comment ID:', comment._id); // Debug
                    commentsHtml += `
                        <div class="comment">
                            <div class="comment-meta">
                                <div class="author">
                                    <div class="author-avatar">
                                        <img src="${comment.user.profileImage || 'https://placehold.co/30x30'}" alt="${comment.user.username}">
                                    </div>
                                    <span class="author-name">${comment.user.username}</span>
                                </div>
                                <div class="comment-actions">
                                    <span class="comment-date">${commentDate}</span>
                                    ${isOwnComment ? `<button class="delete-comment" data-comment-id="${comment._id}" data-post-id="${postId}">Delete</button>` : ''}
                                </div>
                            </div>
                            <p>${comment.content.replace(/\n/g, '<br>')}</p>
                        </div>
                    `;
                });
                commentsHtml += '</div>';
            } else {
                commentsHtml += '<p>No comments yet.</p>';
            }

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
                <div class="comment-form">
                    <textarea class="comment-input" placeholder="Add a comment..." maxlength="500"></textarea>
                    <button class="comment-button">Post Comment</button>
                </div>
                ${commentsHtml}
            `;

            postModal.classList.remove('hidden');

            // Add event listener for comment submission
            const commentButton = modalBody.querySelector('.comment-button');
            const commentInput = modalBody.querySelector('.comment-input');
            commentButton.addEventListener('click', async () => {
                const content = commentInput.value.trim();
                if (!content) {
                    alert('Please enter a comment.');
                    return;
                }

                const token = localStorage.getItem('token');
                if (!token) {
                    alert('You must be logged in to post a comment.');
                    return;
                }

                try {
                    const response = await fetch(`/api/posts/${postId}/comments`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ content })
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Failed to post comment');
                    }

                    commentInput.value = ''; // Clear input
                    openModal(postId); // Refresh modal to show new comment
                } catch (error) {
                    console.error('Error posting comment:', error.message);
                    alert('Failed to post comment: ' + error.message);
                }
            });

            // Add event listeners for delete buttons
            const deleteButtons = modalBody.querySelectorAll('.delete-comment');
            console.log('Delete Buttons Found:', deleteButtons.length); // Debug
            deleteButtons.forEach(button => {
                button.addEventListener('click', async () => {
                    const commentId = button.getAttribute('data-comment-id');
                    const postId = button.getAttribute('data-post-id');
                    const token = localStorage.getItem('token');

                    if (!token) {
                        alert('You must be logged in to delete a comment.');
                        return;
                    }

                    if (confirm('Are you sure you want to delete this comment?')) {
                        try {
                            const response = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': `Bearer ${token}`
                                }
                            });

                            if (!response.ok) {
                                const errorData = await response.json();
                                throw new Error(errorData.message || 'Failed to delete comment');
                            }

                            openModal(postId); // Refresh modal to reflect deletion
                        } catch (error) {
                            console.error('Error deleting comment:', error.message);
                            alert('Failed to delete comment: ' + error.message);
                        }
                    }
                });
            });
        } catch (err) {
            console.error('Error fetching post details:', err);
            modalBody.innerHTML = '<p>Error loading post details.</p>';
            postModal.classList.remove('hidden');
        }
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