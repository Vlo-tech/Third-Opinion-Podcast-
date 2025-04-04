document.addEventListener("DOMContentLoaded", function () {
  const episodeList = document.getElementById("episode-list");
  console.log("episodeList element:", episodeList);

  function loadEpisodes() {
    episodeList.innerHTML = "<p>Loading episodes...</p>";
    console.log("Fetching episodes from http://localhost:3000/api/episodes ...");
    
    fetch("http://localhost:3000/api/episodes")
      .then(response => {
        console.log("Response received:", response);
        return response.json();
      })
      .then(episodes => {
        console.log("Fetched episodes:", episodes);
        episodeList.innerHTML = ""; // Clear loading message

        if (episodes.length === 0) {
          console.warn("No episodes found in API response.");
          episodeList.innerHTML = "<p>No episodes to display.</p>";
        }

        episodes.forEach(episode => {
          console.log("Episode", episode.episodeNumber, "thumbnail:", episode.thumbnail);
          const episodeCard = `
            <div class="episode-card">
              <a href="episode2.html?episodeNumber=${episode.episodeNumber}">
                <img src="${episode.thumbnail}" alt="Episode ${episode.episodeNumber} Cover" class="episode-image">
                <div class="play-button" data-audio-url="${episode.audioUrl}">&#9658;</div>
              </a>
              <div class="episode-content">
                <h2 class="episode-title">${episode.title}</h2>
                <p class="episode-summary">${episode.summary}</p>
              </div>
            </div>
          `;
          console.log("Adding episode card for episode", episode.episodeNumber);
          episodeList.innerHTML += episodeCard;
        });
        console.log("Finished adding episode cards.");
      })
      .catch(error => {
        episodeList.innerHTML = `<p style="color:red;">Error loading episodes.</p>`;
        console.error("Error fetching episodes:", error);
      });
  }

  loadEpisodes();
});
