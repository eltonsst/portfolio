// Configuration
const config = {
    postsDirectory: 'posts/',
    postsListFile: 'posts/index.json',
    previewLength: 280,
    pagesDirectory: 'pages/'
};

function debugElementCheck() {
    const elementsToCheck = [
        'posts-list',
        'post-content', 
        'content'
    ];

    console.log('--- Element Debugging ---');
    elementsToCheck.forEach(id => {
        const element = document.getElementById(id);
        console.log(`${id}:`, {
            found: !!element,
            element: element,
            parentElement: element ? element.parentElement : null
        });
    });
    console.log('Document ready state:', document.readyState);
    console.log('--- End of Element Debugging ---');
}

async function init() {
    console.log('Initializing application...');
    debugElementCheck();
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
            if (page === 'posts') {
                await loadPostsList();
                history.pushState({}, '', '#posts');
            } else {
                await loadPage(page);
                history.pushState({}, '', `#${page}`);
            }
        });
    });

    // Handle hash change for deep linking
    window.addEventListener('hashchange', async () => {
        const hash = window.location.hash.slice(1);
        if (hash.startsWith('post/')) {
            await loadPost(hash.replace('post/', ''));
        } else if (hash === 'posts') {
            await loadPostsList();
        } else if (['about', 'contact'].includes(hash)) {
            await loadPage(hash);
        }
    });
}

function createPostPreview(markdown) {
    const plainText = markdown
        .replace(/#+\s+.*\n/g, '')  // Remove headers
        .replace(/```[\s\S]*?```/g, '') // Remove code blocks
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // Convert links to text
        .replace(/[*_`](.+?)[*_`]/g, '$1'); // Remove emphasis markers
    
    return plainText.trim().slice(0, config.previewLength) + 
           (plainText.length > config.previewLength ? '...' : '');
}

async function loadPostsList() {
    const postsList = document.getElementById('posts-list') || createElement('posts-list');
    const postContent = document.getElementById('post-content') || createElement('post-content');

    console.log('Loading posts list - Element check:', {
        'posts-list': !!postsList,
        'post-content': !!postContent
    });

    try {
        const response = await fetch(config.postsListFile);
        const posts = await response.json();
        
        postsList.innerHTML = ''; 
        postContent.innerHTML = ''; 
        
        for (const post of posts) {
            const postContentResponse = await fetch(`${config.postsDirectory}${post.filename}`);
            const postContentText = await postContentResponse.text();
            const preview = createPostPreview(postContentText);
            
            const postElement = document.createElement('article');
            postElement.className = 'post-entry';
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
        }
    } catch (error) {
        console.error('Error loading posts:', error);
        postsList.innerHTML = 'Error loading posts: ' + error.message;
    }
}

async function loadPost(filename) {
    const postsList = document.getElementById('posts-list') || createElement('posts-list');
    const postContent = document.getElementById('post-content') || createElement('post-content');
    
    try {
        postsList.innerHTML = ''; // Clear posts list when loading a specific post
        const response = await fetch(`${config.postsDirectory}${filename}`);
        const markdown = await response.text();
        postContent.innerHTML = marked.parse(markdown);
    } catch (error) {
        console.error('Error loading post:', error);
        postContent.innerHTML = 'Error loading post: ' + error.message;
    }
}

async function loadPage(pageName) {
    const postsList = document.getElementById('posts-list') || createElement('posts-list');
    const postContent = document.getElementById('post-content') || createElement('post-content');

    try {
        postsList.innerHTML = ''; // Clear posts list
        const response = await fetch(`${config.pagesDirectory}${pageName}.html`);
        const pageContent = await response.text();
        postContent.innerHTML = pageContent;
    } catch (error) {
        console.error(`Error loading ${pageName} page:`, error);
        postContent.innerHTML = `Error loading ${pageName} page: ${error.message}`;
    }
}

function createElement(id) {
    let el = document.getElementById(id);
    if (!el) {
        el = document.createElement('div');
        el.id = id;
        document.getElementById('content').appendChild(el);
    }
    return el;
}

document.addEventListener('DOMContentLoaded', init);
window.addEventListener('load', () => {
    console.log('Window load event triggered');
    debugElementCheck();
});