document.addEventListener("DOMContentLoaded", function () {
  const episodeList = document.getElementById("episode-list");
  const toggleButton = document.getElementById("toggle-source");
  const audioPlayer = document.getElementById("audioPlayer");

  // Default to offline mode (local JSON)
  let useMongoDB = false;

  function loadEpisodes() {
    episodeList.innerHTML = "<p>Loading episodes...</p>";
    const url = useMongoDB ? "/api/episodes" : "episodes.json"; // Choose data source

    fetch(url)
      .then(response => response.json())
      .then(episodes => {
        episodeList.innerHTML = "";
        episodes.forEach(episode => {
          const episodeCard = `
            <div class="episode-card">
              <a href="episode${episode.episodeNumber}.html">
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

        // Add event listeners to play buttons for the audio player
        document.querySelectorAll('.play-button').forEach(button => {
          button.addEventListener('click', (event) => {
            const audioUrl = event.target.getAttribute('data-audio-url');
            if (audioUrl) {
              audioPlayer.src = audioUrl;
              audioPlayer.style.display = 'block'; // Show audio player if hidden
              audioPlayer.play();
            }
          });
        });
      })
      .catch(error => {
        episodeList.innerHTML = `<p style="color:red;">Error loading episodes.</p>`;
        console.error("Error fetching episodes:", error);
      });
  }

  // Initial load
  loadEpisodes();

  // Toggle between offline (JSON) and online (MongoDB)
  toggleButton.addEventListener("click", () => {
    useMongoDB = !useMongoDB;
    toggleButton.textContent = useMongoDB ? "Switch to Offline Mode" : "Switch to Online Mode";
    loadEpisodes();
  });
});
