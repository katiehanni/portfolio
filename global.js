console.log('IT\'S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
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
  { url: "https://github.com/kathehann", text: "GitHub", external: true }
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
  select.addEventListener('input', function (event) {
    console.log('color scheme changed to', event.target.value);
    document.documentElement.style.setProperty('color-scheme', event.target.value);
    localStorage.colorScheme = event.target.value;
  });

  // Load saved preference
  if ("colorScheme" in localStorage) {
    document.documentElement.style.setProperty('color-scheme', localStorage.colorScheme);
    select.value = localStorage.colorScheme;
  }
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
