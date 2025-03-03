function loadMoreEpisodes() {
  const moreEpisodesSection = document.getElementById('more-episodes');
  if (moreEpisodesSection.style.display === 'block') {
    moreEpisodesSection.style.display = 'none';
  } else {
    moreEpisodesSection.style.display = 'block';
    moreEpisodesSection.innerHTML = `
      <div class="dynamic-episode-card">
        <img src="../Tajova web images/NEW EPISODES THUMBNAIL.png" alt="Episode 7 Cover" class="dynamic-episode-image">
        <div class="dynamic-episode-content">
          <h2 class="dynamic-episode-title">Episode 7: New Insights</h2>
          <p class="dynamic-episode-summary">Fresh perspectives and new discussions.</p>
          <a href="episode7.html" class="dynamic-episode-link">Listen Now</a>
        </div>
      </div>
      <div class="dynamic-episode-card">
        <img src="../Tajova web images/NEW EPISODES THUMBNAIL.png" alt="Episode 8 Cover" class="dynamic-episode-image">
        <div class="dynamic-episode-content">
          <h2 class="dynamic-episode-title">Episode 8: Special Guest</h2>
          <p class="dynamic-episode-summary">An exclusive interview with a special guest.</p>
          <a href="episode8.html" class="dynamic-episode-link">Listen Now</a>
        </div>
      </div>
    `;
  }
}