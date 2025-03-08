// filepath: c:\Desktop\Third Opinion Podcast Website\hosts page\scripts.js
document.addEventListener('DOMContentLoaded', function() {
    const videos = document.querySelectorAll('video');

    videos.forEach(video => {
        video.addEventListener('mouseenter', function() {
            this.play();
        });

        video.addEventListener('mouseleave', function() {
            this.pause();
            this.currentTime = 0;
        });

        // Ensure videos are reset on page load
        video.pause();
        video.currentTime = 0;
    });
});