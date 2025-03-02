function loadMoreEpisodes() {
  const moreEpisodesSection = document.getElementById('more-episodes');
  moreEpisodesSection.style.display = 'block';
  moreEpisodesSection.innerHTML = `
    <div class="episode-card">
      <img src="../Tajova web images/NEW EPISODES THUMBNAIL.png" alt="Episode 7 Cover" class="episode-image">
      <div class="episode-content">
        <h2 class="episode-title">Episode 7: New Insights</h2>
        <p class="episode-summary">Fresh perspectives and new discussions.</p>
        <a href="episode7.html" class="episode-link">Listen Now</a>
      </div>
    </div>
    <div class="episode-card">
      <img src="../Tajova web images/NEW EPISODES THUMBNAIL.png" alt="Episode 8 Cover" class="episode-image">
      <div class="episode-content">
        <h2 class="episode-title">Episode 8: Special Guest</h2>
        <p class="episode-summary">An exclusive interview with a special guest.</p>
        <a href="episode8.html" class="episode-link">Listen Now</a>
      </div>
    </div>
  `;
}