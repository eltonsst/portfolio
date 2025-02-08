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
    await handleNavigation(hash);
}

function setupNavigation() {
    console.log('Setting up navigation...');

    document.querySelector('.site-title').addEventListener('click', async (e) => {
        e.preventDefault();
        await handleNavigation('posts');
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
        
        content.offsetHeight;
        content.classList.add('fade-in');
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

        for (let index = 0; index < posts.length; index++) {
            const post = posts[index];
            const postResponse = await fetch(`${config.postsDirectory}${post.filename}`);
            const content = await postResponse.text();
            const preview = createPostPreview(content);

            const postElement = document.createElement('article');
            postElement.className = 'post-entry';
            postElement.style.setProperty('--animation-order', index);
            postElement.innerHTML = `
                <a href="#post/${post.filename}" class="post-title">${post.title}</a>
                <div class="post-meta">${post.date} • ${post.readingTime} min read</div>
                <div class="post-preview">${preview}</div>
            `;

            postsList.appendChild(postElement);
        }
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

        const response = await fetch(`${config.postsDirectory}${filename}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const content = await response.text();

        postContent.innerHTML = DOMPurify.sanitize(marked.parse(content));
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

const DOMPurify = window.DOMPurify;

document.addEventListener('DOMContentLoaded', init);
