// Get elements for navigation and search bar
const searchIcon = document.getElementById('searchIcon');
const searchBar = document.getElementById('searchBar');
const nav = document.querySelector('nav'); // Selecting nav directly
const closeSearch = document.getElementById('closeSearch');
const searchInput = document.getElementById('Searchinput'); // Correct ID

// Show search bar and hide navigation menu when the search icon is clicked
searchIcon.addEventListener('click', () => {
    searchBar.style.display = 'flex';
    nav.style.display = 'none';
    searchInput.focus();
});

// Close search bar and show navigation menu when 'X' is clicked
closeSearch.addEventListener('click', () => {
    searchBar.style.display = 'none';
    nav.style.display = 'flex';
});

// Handle search input (replace with actual search logic)
searchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        // Implement your actual search logic here
        const searchTerm = searchInput.value;
        console.log('Searching for:', searchTerm);
        // Example: Perform a search on your page content or make a server request
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const carousel = document.querySelector('.carousel');
    const items = document.querySelectorAll('.carousel-item');
    const prevButton = document.getElementById('prev');
    const nextButton = document.getElementById('next');
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const navMenu = document.querySelector('nav ul');

    hamburgerMenu.addEventListener('click', function() {
        navMenu.classList.toggle('show');
    });

    // Initialize carousel index
    let currentIndex = 0;

    // Function to update carousel position
    const updateCarousel = () => {
        items.forEach((item, index) => {
            item.style.transform = `translateX(${(index - currentIndex) * 100}%)`;
        });
    };

    // Function to handle carousel navigation
    const navigateCarousel = (direction) => {
        if (direction === 'prev') {
            currentIndex = (currentIndex > 0) ? currentIndex - 1 : items.length - 1;
        } else if (direction === 'next') {
            currentIndex = (currentIndex < items.length - 1) ? currentIndex + 1 : 0;
        }
        updateCarousel();
    };

    // Add event listeners for carousel navigation buttons
    prevButton.addEventListener('click', () => navigateCarousel('prev'));
    nextButton.addEventListener('click', () => navigateCarousel('next'));

    // Initialize the carousel
    updateCarousel();
});
