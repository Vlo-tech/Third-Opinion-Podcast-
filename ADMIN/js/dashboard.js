// admin/js/dashboard.js

document.addEventListener("DOMContentLoaded", () => {
  // 1) Display the user’s email (passed via Passport in the session)
  fetch("/api/current-user")
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("adminEmail").textContent = data.email || "Unknown";
      document.getElementById("userRole").textContent = data.role || "—";
    })
    .catch((err) => {
      console.error("Error fetching current user:", err);
      document.getElementById("adminEmail").textContent = "Unknown";
      document.getElementById("userRole").textContent = "—";
    });

  // 2) Fetch stats (userCount, episodeCount)
  fetch("/admin/api/stats")
    .then((res) => res.json())
    .then((stats) => {
      document.getElementById("userCount").textContent = stats.userCount;
      document.getElementById("episodeCount").textContent = stats.episodeCount;
    })
    .catch((err) => {
      console.error("Error fetching stats:", err);
      document.getElementById("userCount").textContent = "—";
      document.getElementById("episodeCount").textContent = "—";
    });
});
