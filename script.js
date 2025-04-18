// Blade Runner UI effects and interactions

document.addEventListener('DOMContentLoaded', function () {

  // Initialize menu link behavior
  initMenuLinks();

  // Initialize glitch text effect
  initGlitchText();

  // Initialize cursor effect
  initCustomCursor();

  // Initialize parallax effect
  initParallax();

  // Add to your existing event listeners
  document.querySelector('a[href="#blog"]').addEventListener('click', function () {
    loadBlogPosts();
  });
});

// Handle menu link clicks and show appropriate content
function initMenuLinks() {
  const menuLinks = document.querySelectorAll('.main-menu a');

  menuLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();

      const targetId = this.getAttribute('href').substring(1);
      const contentRegions = document.querySelectorAll('.content-region');

      // Hide all content regions
      contentRegions.forEach(region => {
        region.classList.add('hide');
      });

      // Show target content region
      const targetRegion = document.getElementById(targetId);
      if (targetRegion) {
        targetRegion.classList.remove('hide');

        // Add entry animation
        targetRegion.style.opacity = 0;
        targetRegion.style.transform = 'translateY(20px)';

        setTimeout(() => {
          targetRegion.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
          targetRegion.style.opacity = 1;
          targetRegion.style.transform = 'translateY(0)';
        }, 50);
      }

      // Update active menu item
      menuLinks.forEach(menuLink => {
        menuLink.classList.remove('active');
      });

      this.classList.add('active');
    });
  });

  // Show default content section (first one) if URL has no hash
  if (!window.location.hash) {
    const firstContentRegion = document.querySelector('.content-region');
    if (firstContentRegion) {
      firstContentRegion.classList.remove('hide');
    }

    const firstMenuLink = document.querySelector('.main-menu a');
    if (firstMenuLink) {
      firstMenuLink.classList.add('active');
    }
  } else {
    // If URL has hash, click the corresponding menu link
    const targetLink = document.querySelector(`.main-menu a[href="${window.location.hash}"]`);
    if (targetLink) {
      targetLink.click();
    }
  }
}

// Initialize glitch text effect
function initGlitchText() {
  const glitchElements = document.querySelectorAll('.glitch-text');

  glitchElements.forEach(element => {
    const text = element.textContent;
    element.setAttribute('data-text', text);
  });
}


// Initialize custom cursor
function initCustomCursor() {
  const cursor = document.createElement('div');
  cursor.classList.add('custom-cursor');
  document.body.appendChild(cursor);

  // Add cursor styles
  const style = document.createElement('style');
  style.textContent = `
    .custom-cursor {
      position: fixed;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 1px solid var(--primary-color);
      pointer-events: none;
      transform: translate(-50%, -50%);
      z-index: 9999;
      opacity: 0.7;
      transition: width 0.2s, height 0.2s, opacity 0.2s;
      background: radial-gradient(circle, rgba(255, 158, 79, 0.1) 0%, rgba(0, 194, 186, 0.1) 100%);
      box-shadow: 0 0 10px rgba(0, 194, 186, 0.3);
    }
    
    .custom-cursor.active {
      width: 10px;
      height: 10px;
      opacity: 1;
      background: radial-gradient(circle, rgba(255, 158, 79, 0.3) 0%, rgba(0, 194, 186, 0.3) 100%);
    }
    
    /* Hide default cursor */
    body {
      cursor: none;
    }
    
    /* Show default cursor on touch devices */
    @media (pointer: coarse) {
      .custom-cursor {
        display: none;
      }
      
      body {
        cursor: auto;
      }
    }
  `;
  document.head.appendChild(style);

  // Update cursor position
  document.addEventListener('mousemove', e => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
  });

  // Add active class on mouse down
  document.addEventListener('mousedown', () => {
    cursor.classList.add('active');
  });

  // Remove active class on mouse up
  document.addEventListener('mouseup', () => {
    cursor.classList.remove('active');
  });

  // Add hover effect for interactive elements
  const interactiveElements = document.querySelectorAll('a, button, .interactive');

  interactiveElements.forEach(element => {
    element.addEventListener('mouseenter', () => {
      cursor.style.width = '30px';
      cursor.style.height = '30px';
      cursor.style.opacity = '1';
      cursor.style.borderColor = 'var(--secondary-color)';
    });

    element.addEventListener('mouseleave', () => {
      cursor.style.width = '20px';
      cursor.style.height = '20px';
      cursor.style.opacity = '0.7';
      cursor.style.borderColor = 'var(--primary-color)';
    });
  });
}

// Initialize parallax effect for background elements
function initParallax() {
  const parallaxElements = document.querySelectorAll('.parallax');

  document.addEventListener('mousemove', e => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;

    parallaxElements.forEach(element => {
      const speed = element.getAttribute('data-speed') || 2; // 10x slower (was 20)
      const moveX = (x - 0.5) * speed;
      const moveY = (y - 0.5) * speed;

      // Use transition for slower movement
      if (!element.style.transition) {
        element.style.transition = 'transform 3s ease-out'; // Slow transition
      }

      element.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
    });
  });
}

// TypeWriter effect for text elements
function typeWriter(element, text, speed = 500, delay = 0) { // 10x slower (was 50ms)
  let i = 0;
  element.textContent = '';
  element.classList.add('terminal-text');

  setTimeout(() => {
    const typing = setInterval(() => {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
      } else {
        clearInterval(typing);
        element.classList.add('typing-done');
      }
    }, speed);
  }, delay);
}

// Add this function to your script.js file
function loadBlogPosts() {
  // Example blog post metadata
  const blogPosts = [
    {
      id: 1,
      title: "Resuscitating FastAPI services",
      date: "2025-04-19",
      category: "Tech",
      filename: "resuscitating_fastapi.md"
    },
  ];

  const blogContainer = document.getElementById('blog-posts-container');
  blogContainer.innerHTML = ''; // Clear loading indicator

  blogPosts.forEach(post => {
    // Create blog post article element
    const article = document.createElement('article');
    article.className = 'blog-post';

    // Add blog header
    article.innerHTML = `
      <div class="blog-header">
        <h3>${post.title}</h3>
        <div class="blog-meta">
          <span class="blog-date">${post.date}</span>
          <span class="blog-category">${post.category}</span>
        </div>
      </div>
      <div class="blog-content">Loading content...</div>
    `;

    blogContainer.appendChild(article);

    // Load and render markdown content
    fetch(`blog/${post.filename}`)
      .then(response => response.text())
      .then(markdown => {
        const contentDiv = article.querySelector('.blog-content');
        // Convert markdown to HTML and insert
        contentDiv.innerHTML = marked.parse(markdown);
      })
      .catch(error => {
        console.error('Error loading blog post:', error);
        const contentDiv = article.querySelector('.blog-content');
        contentDiv.innerHTML = '<p>Error loading blog content.</p>';
      });
  });
}

function displayBlogPost(post) {
  const postContainer = document.getElementById('blog-post-container');

  // Create the blog post HTML
  const postHTML = `
    <div class="blog-post">
      <h2>${post.title}</h2>
      <p class="post-date">${formatDate(post.date)}</p>
      <div class="markdown-content">${marked.parse(post.content)}</div>
    </div>
  `;

  postContainer.innerHTML = postHTML;
}