// Configuration
const config = {
    postsDirectory: 'posts/',
    postsListFile: 'posts/index.json',
    previewLength: 280,
    pagesDirectory: 'pages/'
};

// Cache for posts content
const postsCache = new Map();

async function init() {
    console.log('Initializing application...');
    setupNavigation();
    
    // Preload posts data
    prefetchPosts();
    
    const hash = window.location.hash.slice(1);
    await handleNavigation(hash);
}

function setupNavigation() {
    console.log('Setting up navigation...');
    
    document.querySelector('.site-title').addEventListener('click', async (e) => {
        e.preventDefault();
        await handleNavigation('posts'); // 'posts' is treated as home page
    });

    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            const page = e.target.dataset.page;
            await handleNavigation(page);
        });
    });

    window.addEventListener('hashchange', async () => {
        const hash = window.location.hash.slice(1);
        await handleNavigation(hash);
    });
}

async function handleNavigation(route) {
    const content = document.getElementById('content');
    content.classList.remove('fade-in');
    
    // Use requestAnimationFrame for smooth transitions
    requestAnimationFrame(async () => {
        if (route.startsWith('post/')) {
            await loadPost(route.replace('post/', ''));
            history.pushState({}, '', `#${route}`);
        } else if (route === 'posts' || route === '') {
            await loadPostsList();
            history.pushState({}, '', '#posts');
        } else if (['about', 'contact'].includes(route)) {
            await loadPage(route);
            history.pushState({}, '', `#${route}`);
        }
        
        // Trigger reflow to ensure animation plays
        content.offsetHeight;
        content.classList.add('fade-in');
    });
}

// Preload posts data
async function prefetchPosts() {
    try {
        const response = await fetch(config.postsListFile);
        const posts = await response.json();
        
        // Fetch all posts in parallel
        const fetchPromises = posts.map(post => 
            fetch(`${config.postsDirectory}${post.filename}`)
                .then(res => res.text())
                .then(content => {
                    postsCache.set(post.filename, {
                        content,
                        preview: createPostPreview(content)
                    });
                })
        );
        
        // Wait for all fetches to complete
        await Promise.all(fetchPromises);
    } catch (error) {
        console.error('Error prefetching posts:', error);
    }
}

function createPostPreview(markdown) {
    const plainText = markdown
        .replace(/#+\s+.*\n/g, '')
        .replace(/```[\s\S]*?```/g, '')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/[*_`](.+?)[*_`]/g, '$1');

    return plainText.trim().slice(0, config.previewLength) +
        (plainText.length > config.previewLength ? '...' : '');
}

async function loadPostsList() {
    const postsList = document.getElementById('posts-list');
    const postContent = document.getElementById('post-content');

    try {
        const response = await fetch(config.postsListFile);
        const posts = await response.json();

        postsList.innerHTML = '';
        postContent.innerHTML = '';

        posts.forEach((post, index) => {
            const cachedPost = postsCache.get(post.filename);
            const preview = cachedPost ? cachedPost.preview : 'Loading preview...';

            const postElement = document.createElement('article');
            postElement.className = 'post-entry';
            postElement.style.setProperty('--animation-order', index);
            postElement.innerHTML = `
                <a href="#post/${post.filename}" class="post-title">${post.title}</a>
                <div class="post-meta">${post.date} • ${post.readingTime} min read</div>
                <div class="post-preview">${preview}</div>
            `;

            postsList.appendChild(postElement);
        });
    } catch (error) {
        console.error('Error loading posts:', error);
        postsList.innerHTML = `
            <div class="error-message fade-in">
                Unable to load posts. Please try again later.
            </div>`;
    }
}

async function loadPost(filename) {
    const postsList = document.getElementById('posts-list');
    const postContent = document.getElementById('post-content');

    try {
        postsList.innerHTML = '';
        postContent.innerHTML = '<div class="loading fade-in">Loading...</div>';

        let content;
        if (postsCache.has(filename)) {
            content = postsCache.get(filename).content;
        } else {
            const response = await fetch(`${config.postsDirectory}${filename}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            content = await response.text();
        }

        postContent.innerHTML = marked.parse(content);
    } catch (error) {
        console.error('Error loading post:', error);
        postContent.innerHTML = `
            <div class="error-message fade-in">
                Unable to load post. Please try again later.
            </div>`;
    }
}

async function loadPage(pageName) {
    const postsList = document.getElementById('posts-list');
    const postContent = document.getElementById('post-content');

    try {
        postsList.innerHTML = '';
        postContent.innerHTML = '<div class="loading fade-in">Loading...</div>';

        const response = await fetch(`${config.pagesDirectory}${pageName}.html`);
        if (!response.ok) throw new Error('Page not found');

        const pageContent = await response.text();
        postContent.innerHTML = pageContent;
    } catch (error) {
        console.error(`Error loading ${pageName} page:`, error);
        postContent.innerHTML = `
            <div class="not-found fade-in">
                <h2>Page Not Found</h2>
                <p>The page you're looking for doesn't exist.</p>
                <a href="#posts">Return to Posts</a>
            </div>`;
    }
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(registration => {
            console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch(error => {
            console.log('Service Worker registration failed:', error);
        });
}

document.addEventListener('DOMContentLoaded', init);