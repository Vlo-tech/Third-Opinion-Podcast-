document.addEventListener("DOMContentLoaded", function () {
  const episodeList = document.getElementById("episode-list");

  function loadEpisodes() {
    episodeList.innerHTML = "<p>Loading episodes...</p>";
    fetch("http://localhost:3000/api/episodes")
      .then(response => response.json())
      .then(episodes => {
        episodeList.innerHTML = "";
        episodes.forEach(episode => {
          const episodeCard = `
            <div class="episode-card">
              <a href="episode.html?episodeNumber=${episode.episodeNumber}">
                <img src="${episode.thumbnail}" alt="Episode ${episode.episodeNumber} Cover" class="episode-image">
                <div class="play-button" data-audio-url="${episode.audioUrl}">&#9658;</div>
              </a>
              <div class="episode-content">
                <h2 class="episode-title">${episode.title}</h2>
                <p class="episode-summary">${episode.summary}</p>
              </div>
            </div>
          `;
          episodeList.innerHTML += episodeCard;
        });
      })
      .catch(error => {
        episodeList.innerHTML = `<p style="color:red;">Error loading episodes.</p>`;
        console.error("Error fetching episodes:", error);
      });
  }

  loadEpisodes();
});
