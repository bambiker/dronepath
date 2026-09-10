// Dark Mode Toggle
const darkModeToggle = document.getElementById('darkModeToggle');
const isDarkMode = localStorage.getItem('darkMode') === 'true';

if (isDarkMode) {
  document.body.classList.add('dark-mode');
  darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
}

darkModeToggle.addEventListener('click', function() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', isDark);
  darkModeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});

// Wait for map.js to load and functions to be available
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM Content Loaded');
  
  const calculateBtn = document.getElementById('calculateBtn');
  const checkbox = document.getElementById('considerBuildings');
  
  // Function getHeight wrapper that calls calcHeight
  window.getHeight = function() {
    console.log('getHeight called');
    if (typeof calcHeight === 'function') {
      calcHeight();
    } else {
      console.error('calcHeight function not found');
      alert('Error: Calculator not loaded. Please refresh the page.');
    }
  };
  
  if (calculateBtn) {
    console.log('Calculate button found');
    calculateBtn.addEventListener('click', function() {
      console.log('Calculate button clicked');
      window.getHeight();
    });
  } else {
    console.error('Calculate button not found');
  }
  
  if (checkbox) {
    checkbox.addEventListener('change', function() {
      if (typeof window.considerBuildings !== 'undefined') {
        window.considerBuildings = this.checked;
        console.log('considerBuildings set to:', this.checked);
      }
    });
  }
});
