import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// Fetch project data
const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');

// Initialize query and selected index
let query = '';
let selectedYear = null;

// Helper function to filter projects based on query and selected year
function getFilteredProjects() {
  let filtered = projects;
  
  // Filter by search query
  if (query) {
    filtered = filtered.filter((project) => {
      let values = Object.values(project).join('\n').toLowerCase();
      return values.includes(query.toLowerCase());
    });
  }
  
  // Filter by selected year
  if (selectedYear !== null) {
    filtered = filtered.filter((project) => project.year === selectedYear);
  }
  
  return filtered;
}

// Render projects based on current filters
function renderFilteredProjects() {
  const filteredProjects = getFilteredProjects();
  renderProjects(filteredProjects, projectsContainer, 'h2');
}

// Initial render of projects
if (projectsContainer) {
  renderProjects(projects, projectsContainer, 'h2');
  
  // Add project count to the page title
  const projectsTitle = document.querySelector('.projects-title');
  if (projectsTitle) {
    projectsTitle.textContent = `Projects (${projects.length})`;
  }
}

// Refactor all plotting into one function
// Note: This function accepts projectsGiven parameter but intentionally uses the 
// global 'projects' array instead. This ensures the pie chart always displays 
// all projects grouped by year, regardless of search filters.
// The combination of search + year filtering is handled in getFilteredProjects()
function renderPieChart(projectsGiven) {
  // Clear existing paths and legend items
  d3.select('svg').selectAll('path').remove();
  d3.select('.legend').selectAll('li').remove();
  
  // Re-calculate rolled data from ALL projects (not filtered)
  // This ensures the pie chart always shows all years
  let newRolledData = d3.rollups(
    projects,
    (v) => v.length,
    (d) => d.year
  );
  
  // Re-calculate data
  let newData = newRolledData.map(([year, count]) => {
    return { value: count, label: year };
  });
  
  // If no data, don't render
  if (newData.length === 0) {
    return;
  }
  
  // Re-calculate slice generator, arc data, arcs
  let colors = d3.scaleOrdinal(d3.schemeTableau10);
  let newSliceGenerator = d3.pie().value((d) => d.value);
  let newArcData = newSliceGenerator(newData);
  let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  let newArcs = newArcData.map((d) => arcGenerator(d));
  
  // Update paths
  let svg = d3.select('svg');
  newArcs.forEach((arc, i) => {
    const yearLabel = newData[i].label;
    const isSelected = selectedYear === yearLabel;
    
    svg
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(i))
      .attr('class', isSelected ? 'selected' : '')
      .on('click', () => {
        // Toggle selection
        selectedYear = selectedYear === yearLabel ? null : yearLabel;
        
        // Re-render pie chart to update selection state
        renderPieChart();
        
        // Re-render filtered projects
        renderFilteredProjects();
      });
  });
  
  // Update legend
  let legend = d3.select('.legend');
  newData.forEach((d, idx) => {
    const isSelected = selectedYear === d.label;
    
    legend
      .append('li')
      .attr('style', `--color:${colors(idx)}`)
      .attr('class', isSelected ? 'selected' : '')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => {
        // Toggle selection
        selectedYear = selectedYear === d.label ? null : d.label;
        
        // Re-render pie chart to update selection state
        renderPieChart();
        
        // Re-render filtered projects
        renderFilteredProjects();
      });
  });
}

// Call renderPieChart on page load
renderPieChart();

// Search functionality
let searchInput = document.querySelector('.searchBar');

if (searchInput) {
  searchInput.addEventListener('input', (event) => {
    // Update query value
    query = event.target.value;
    
    // Render filtered projects
    renderFilteredProjects();
    
    // Re-render pie chart (always shows all projects)
    renderPieChart();
  });
}
