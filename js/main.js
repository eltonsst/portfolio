// Configuration
const config = {
    postsDirectory: 'posts/',
    postsListFile: 'posts/index.json',
    previewLength: 280,
    pagesDirectory: 'pages/'
};

async function init() {
    console.log('Initializing application...');
    setupNavigation();
    const hash = window.location.hash.slice(1);

    if (hash.startsWith('post/')) {
        await loadPost(hash.replace('post/', ''));
    } else if (hash === 'posts') {
        await loadPostsList();
    } else if (['about', 'contact'].includes(hash)) {
        await loadPage(hash);
    } else {
        await loadPostsList(); // Default to posts list
    }
}

function setupNavigation() {
    console.log('Setting up navigation...');
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            const page = e.target.dataset.page;

            // Add fade-out effect
            document.getElementById('content').style.opacity = '0';

            setTimeout(async () => {
                if (page === 'posts') {
                    await loadPostsList();
                    history.pushState({}, '', '#posts');
                } else {
                    await loadPage(page);
                    history.pushState({}, '', `#${page}`);
                }
                // Fade back in
                document.getElementById('content').style.opacity = '1';
            }, 300);
        });
    });

    window.addEventListener('hashchange', async () => {
        const hash = window.location.hash.slice(1);

        // Add fade-out effect
        document.getElementById('content').style.opacity = '0';

        setTimeout(async () => {
            if (hash.startsWith('post/')) {
                await loadPost(hash.replace('post/', ''));
            } else if (hash === 'posts') {
                await loadPostsList();
            } else if (['about', 'contact'].includes(hash)) {
                await loadPage(hash);
            }
            // Fade back in
            document.getElementById('content').style.opacity = '1';
        }, 300);
    });
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

        posts.forEach(async (post, index) => {
            const postContentResponse = await fetch(`${config.postsDirectory}${post.filename}`);
            const postContentText = await postContentResponse.text();
            const preview = createPostPreview(postContentText);

            const postElement = document.createElement('article');
            postElement.className = 'post-entry';
            postElement.style.setProperty('--animation-order', index);
            postElement.innerHTML = `
                <a href="#post/${post.filename}" class="post-title">${post.title}</a>
                <div class="post-meta">${post.date} • ${post.readingTime} min read</div>
                <div class="post-preview">${preview}</div>
            `;

            postsList.appendChild(postElement);
            postElement.querySelector('.post-title').addEventListener('click', (e) => {
                e.preventDefault();
                loadPost(post.filename);
            });
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

        const response = await fetch(`${config.postsDirectory}${filename}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const markdown = await response.text();
        postContent.innerHTML = marked.parse(markdown);
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
        .then(function (registration) {
            console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch(function (error) {
            console.log('Service Worker registration failed:', error);
        });
}

document.addEventListener('DOMContentLoaded', init);