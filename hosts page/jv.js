document.addEventListener('DOMContentLoaded', function() {
    const videos = document.querySelectorAll('video');
  
    videos.forEach(video => {
      video.addEventListener('mouseenter', function() {
        video.style.transition = "opacity 0.3s ease-in-out";
        video.style.opacity = "1";
        this.play();
      });
  
      video.addEventListener('mouseleave', function() {
        this.pause();
        this.currentTime = 0;
        video.style.opacity = "0.8";
      });
  
      // Reset video state on page load
      video.pause();
      video.currentTime = 0;
      video.style.opacity = "0.8";
    });
  });
  