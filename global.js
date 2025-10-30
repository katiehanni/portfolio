console.log('IT\'S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// Lab 4: Modular JavaScript Functions
export async function fetchJSON(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  containerElement.innerHTML = '';
  
  projects.forEach(project => {
    const article = document.createElement('article');
    article.className = 'project-card';
    
    article.innerHTML = `
      <div class="project-image">
        <img src="${project.image}" alt="${project.title}">
      </div>
      <div class="project-content">
        <${headingLevel}>${project.title}</${headingLevel}>
        <p>${project.description}</p>
        <div class="project-year">${project.year}</div>
        <a href="${project.url || '#'}" class="project-link" ${project.url ? 'target="_blank"' : ''}>View Project →</a>
      </div>
    `;
    
    containerElement.appendChild(article);
  });
}

export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}

// Step 3: Automatic navigation menu
// Determine the correct path prefix based on current location
const currentPath = window.location.pathname;
const isInSubdirectory = currentPath.includes('/projects/') || currentPath.includes('/contact/') || currentPath.includes('/cv/');
const pathPrefix = isInSubdirectory ? "../" : "";

const navData = [
  { url: `${pathPrefix}index.html`, text: "Home" },
  { url: `${pathPrefix}projects/index.html`, text: "Projects" },
  { url: `${pathPrefix}contact/index.html`, text: "Contact" },
  { url: `${pathPrefix}cv/index.html`, text: "Resume" },
  { url: "https://github.com/kathehann", text: "GitHub", external: true },
  { url: "https://www.linkedin.com/in/katie-hannigan-423134238", text: "LinkedIn", external: true }
];

const nav = document.querySelector('#nav');
if (nav) {
  navData.forEach(item => {
    const a = document.createElement('a');
    a.href = item.url;
    a.textContent = item.text;
    if (item.external) {
      a.target = '_blank';
    }
    nav.appendChild(a);
  });
}

// Step 2: Automatic current page link
let navLinks = $$("nav a");

let currentLink = navLinks.find(
  (a) => a.host === location.host && a.pathname === location.pathname,
);

currentLink?.classList.add('current');

// Step 4: Dark mode functionality
const select = document.querySelector('.color-scheme select');
if (select) {
  // Load saved theme or default to light
  const savedTheme = localStorage.getItem('colorScheme') || 'light';
  document.documentElement.setAttribute('data-color-scheme', savedTheme);
  select.value = savedTheme;

  select.addEventListener('input', function (event) {
    console.log('color scheme changed to', event.target.value);
    document.documentElement.setAttribute('data-color-scheme', event.target.value);
    localStorage.setItem('colorScheme', event.target.value);
  });
}

// Step 5: Better contact form
const form = document.querySelector('form');
if (form) {
  form.addEventListener('submit', function(event) {
    event.preventDefault();
    
    const data = new FormData(form);
    let url = form.action + '?';
    
    for (let [name, value] of data) {
      url += name + '=' + encodeURIComponent(value) + '&';
    }
    
    // Remove the trailing '&'
    url = url.slice(0, -1);
    
    location.href = url;
  });
}
