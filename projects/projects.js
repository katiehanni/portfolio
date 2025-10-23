import { fetchJSON, renderProjects } from '../global.js';

// Fetch and render all projects
const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');

if (projectsContainer) {
  renderProjects(projects, projectsContainer, 'h2');
  
  // Add project count to the page title
  const projectsTitle = document.querySelector('.projects-title');
  if (projectsTitle) {
    projectsTitle.textContent = `Projects (${projects.length})`;
  }
}
