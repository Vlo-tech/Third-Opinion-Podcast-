// ----------------------
// Navigation & Search Bar
// ----------------------
const searchIcon = document.getElementById('searchIcon');
const searchBar = document.getElementById('searchBar');
const nav = document.querySelector('nav');
const closeSearch = document.getElementById('closeSearch');
const searchInput = document.getElementById('Searchinput');

searchIcon.addEventListener('click', () => {
  searchBar.style.display = 'flex';
  nav.style.display = 'none';
  searchInput.focus();
});

closeSearch.addEventListener('click', () => {
  searchBar.style.display = 'none';
  nav.style.display = 'flex';
});

searchInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    const searchTerm = searchInput.value;
    console.log('Searching for:', searchTerm);
    // Add your search logic here if needed
  }
});

// ----------------------
// Modal Functionality
// ----------------------
window.addEventListener('load', () => {
  const leadModal = document.getElementById('leadModal');
  if (leadModal) {
    leadModal.style.display = 'block';
  }
});

const closeModal = document.getElementById('closeModal');
if (closeModal) {
  closeModal.addEventListener('click', () => {
    document.getElementById('leadModal').style.display = 'none';
  });
}

// Modal Lead Form Submission
const leadForm = document.getElementById('leadForm');
if (leadForm) {
  leadForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    try {
      const response = await fetch('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
      });
      const result = await response.json();
      if (response.ok) {
        alert(result.message);
        document.getElementById('leadModal').style.display = 'none';
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('An error occurred while submitting your information.');
    }
  });
}

// ----------------------
// Footer Lead Form Submission
// ----------------------
const footerLeadForm = document.getElementById('footerLeadForm');
if (footerLeadForm) {
  footerLeadForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = document.getElementById('footerName').value;
    const email = document.getElementById('footerEmail').value;
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
      });
      if (response.ok) {
        alert('Thank you for signing up!');
        footerLeadForm.reset();
      } else {
        alert('Failed to sign up. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting lead:', error);
      alert('An error occurred. Please try again.');
    }
  });
}

// ----------------------
// Carousel Functionality
// ----------------------
document.addEventListener('DOMContentLoaded', function () {
    const carousel = document.querySelector('.carousel');
    const items = document.querySelectorAll('.carousel-item');

    // Custom sequence for the profiles
    const sequence = [0, 1, 2, 1, 0, 1, 2]; // Talia → Josh → Valentine → Josh → Talia → Josh → Valentine
    let currentIndex = 0; // Start at the first profile in the sequence

    // Function to update carousel position
    const updateCarousel = () => {
        items.forEach((item, index) => {
            if (index === sequence[currentIndex]) {
                item.style.display = 'block'; // Show the current profile
                item.style.transform = 'translateX(0)'; // Center the current profile
            } else {
                item.style.display = 'none'; // Hide other profiles
            }
        });
    };

    // Automatically move the carousel every 3 seconds
    setInterval(() => {
        currentIndex = (currentIndex + 1) % sequence.length; // Move to the next profile in the sequence
        updateCarousel();
    }, 3000);

    // Initialize the carousel
    updateCarousel();
});
