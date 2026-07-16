document.addEventListener('DOMContentLoaded', () => {
    const feedContainer = document.getElementById('feed-container');
    const createPostForm = document.getElementById('create-post-form');
    const notificationArea = document.getElementById('notification-area');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Auth Check
    // Assuming token is in cookies, if not, redirect to login
    // Usually this is handled by backend throwing 401
    
    let currentUser = null; // We can parse this from JWT if needed or fetch from /api/auth/me if endpoint exists
    
    // Show Notification
    function showNotification(message, type) {
        notificationArea.textContent = message;
        notificationArea.className = `notification-area notification-${type}`;
        
        setTimeout(() => {
            notificationArea.className = 'notification-area hidden';
        }, 5000);
    }
    
    // Fetch Posts
    async function fetchPosts() {
        try {
            const response = await fetch('/api/posts', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            
            if (response.status === 401 || response.status === 403) {
                window.location.href = '/login.html'; // Adjust based on your auth flow
                return;
            }
            
            if (!response.ok) throw new Error('Failed to fetch posts');
            
            const posts = await response.json();
            renderPosts(posts);
        } catch (error) {
            console.error(error);
            feedContainer.innerHTML = '<p class="text-center">Failed to load posts.</p>';
        }
    }
    
    // Render Posts
    function renderPosts(posts) {
        feedContainer.innerHTML = '';
        
        if (posts.length === 0) {
            feedContainer.innerHTML = '<div class="glassmorphism" style="padding: 2rem; text-align: center;">No posts yet. Be the first to share!</div>';
            return;
        }
        
        posts.forEach(post => {
            const postCard = document.createElement('article');
            postCard.className = 'post-card glassmorphism';
            
            // Format Date
            const date = new Date(post.createdAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            
            // Check if user liked (assuming we can identify current user, for now basic logic)
            // Ideally we need currentUser id to mark 'liked' accurately
            let likeCount = post.likes ? post.likes.length : 0;
            let commentCount = post.comments ? post.comments.length : 0;
            
            // Media
            let mediaHtml = '';
            if (post.mediaUrl && post.mediaType === 'image') {
                mediaHtml = `<div class="post-media"><img src="${post.mediaUrl}" alt="Post media"></div>`;
            } else if (post.mediaUrl && post.mediaType === 'video') {
                mediaHtml = `<div class="post-media"><video controls><source src="${post.mediaUrl}"></video></div>`;
            }
            
            // Comments HTML
            let commentsHtml = '';
            if (post.comments && post.comments.length > 0) {
                post.comments.forEach(comment => {
                    commentsHtml += `
                        <div class="comment">
                            <div class="comment-author">${comment.user ? comment.user.username : 'User'}</div>
                            <div class="comment-text">${escapeHTML(comment.content)}</div>
                        </div>
                    `;
                });
            }
            
            postCard.innerHTML = `
                <div class="post-header">
                    <div class="user-avatar-placeholder">
                        <i class="fa-solid fa-user"></i>
                    </div>
                    <div>
                        <div class="post-author">${post.user ? post.user.username : 'Unknown User'}</div>
                        <div class="post-date">${date}</div>
                    </div>
                </div>
                
                <div class="post-content">${escapeHTML(post.content)}</div>
                ${mediaHtml}
                
                <div class="post-actions">
                    <button class="action-btn like-btn" data-post-id="${post.id}">
                        <i class="fa-solid fa-heart"></i> <span class="like-count">${likeCount}</span> Likes
                    </button>
                    <button class="action-btn comment-toggle-btn">
                        <i class="fa-solid fa-comment"></i> <span class="comment-count">${commentCount}</span> Comments
                    </button>
                    <button class="action-btn share-btn" data-url="${window.location.origin}/post/${post.id}">
                        <i class="fa-solid fa-share"></i> Share
                    </button>
                </div>
                
                <div class="comments-section">
                    <div class="comments-list">${commentsHtml}</div>
                    <form class="add-comment-form" data-post-id="${post.id}">
                        <input type="text" placeholder="Write a comment..." required>
                        <button type="submit"><i class="fa-solid fa-paper-plane"></i></button>
                    </form>
                </div>
            `;
            
            feedContainer.appendChild(postCard);
        });
        
        attachEventListeners();
    }
    
    // Attach event listeners to dynamic elements
    function attachEventListeners() {
        // Like buttons
        document.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const postId = btn.getAttribute('data-post-id');
                try {
                    const response = await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
                    if (response.ok) {
                        fetchPosts(); // Refresh to get updated count and state
                    }
                } catch (error) {
                    console.error('Error liking post:', error);
                }
            });
        });
        
        // Comment toggle buttons
        document.querySelectorAll('.comment-toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const commentsSection = btn.closest('.post-card').querySelector('.comments-section');
                commentsSection.classList.toggle('visible');
            });
        });
        
        // Add comment forms
        document.querySelectorAll('.add-comment-form').forEach(form => {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const postId = form.getAttribute('data-post-id');
                const input = form.querySelector('input');
                const content = input.value.trim();
                
                if (!content) return;
                
                try {
                    const response = await fetch(`/api/posts/${postId}/comment`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ content })
                    });
                    
                    if (response.ok) {
                        input.value = '';
                        fetchPosts(); // Refresh feed
                    } else {
                        const data = await response.json();
                        showNotification(data.message || 'Error adding comment', 'error');
                    }
                } catch (error) {
                    console.error('Error adding comment:', error);
                }
            });
        });
        
        // Share buttons (Copy to clipboard)
        document.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const url = btn.getAttribute('data-url');
                navigator.clipboard.writeText(url).then(() => {
                    showNotification('Link copied to clipboard!', 'success');
                }).catch(err => {
                    console.error('Could not copy text: ', err);
                });
            });
        });
    }
    
    // Handle Post Creation
    createPostForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const content = document.getElementById('post-content').value;
        const mediaUrl = document.getElementById('media-url').value;
        const mediaType = document.getElementById('media-type').value;
        
        const submitBtn = document.getElementById('submit-post-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Posting...';
        
        try {
            const response = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    mediaUrl: mediaUrl || null,
                    mediaType: mediaUrl ? mediaType : null
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showNotification('Post created successfully!', 'success');
                createPostForm.reset();
                fetchPosts(); // Refresh feed
            } else {
                // This will catch the friend-based limit errors (403 Forbidden)
                showNotification(data.message || 'Error creating post', 'error');
            }
        } catch (error) {
            showNotification('Network error occurred', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Post';
        }
    });
    
    // Logout Handler
    if(logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await fetch('/api/auth/logout', { method: 'POST' });
                window.location.href = '/login.html';
            } catch(err) {
                console.error(err);
                window.location.href = '/login.html';
            }
        });
    }
    
    // Helper to escape HTML and prevent XSS
    function escapeHTML(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag])
        );
    }
    
    // Initial fetch
    fetchPosts();
});
