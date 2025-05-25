// admin/routes/adminRoutes.js

const express = require("express");
const path = require("path");
const passport = require("passport");

const {
  ensureLoggedIn,
  ensureAdmin,
  ensureEditor
} = require("../middleware/authMiddleware");

const adminController = require("../controllers/adminController");

const router = express.Router();

// Serve static CSS/JS from the admin/css and admin/js folders:
router.use("/css", express.static(path.join(__dirname, "../css")));
router.use("/js", express.static(path.join(__dirname, "../js")));

// ——— GET /admin/login ———
// Serves the login page. 
// Users click the “Continue with Google” button to hit /auth/google
router.get("/login", (req, res) => {
  return res.sendFile(path.join(__dirname, "../views/login.html"));
});

// ——— GET /admin/logout ———
// Passport’s logout, then redirect to home or login
router.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    req.session.destroy();
    return res.redirect("/"); // or "/admin/login" if you prefer
  });
});

// ——— Protect the following routes: ensureLoggedIn ———

// ——— GET /admin/dashboard ———
// Serve the dashboard HTML (front‐end will fetch stats via /admin/api/stats)
router.get("/dashboard", ensureLoggedIn, (req, res) => {
  return res.sendFile(path.join(__dirname, "../views/dashboard.html"));
});

// ——— GET /admin/api/stats ———
// Returns JSON { userCount, episodeCount }
router.get(
  "/api/stats",
  ensureLoggedIn,
  adminController.getStats
);

// ——— GET /admin/editor ———
// Example Editor page (only admin+editor)
router.get("/editor", ensureLoggedIn, ensureEditor, (req, res) => {
  return res.sendFile(path.join(__dirname, "../views/editor.html"));
});

// ——— GET /admin/error ———
// Access denied / not found
router.get("/error", (req, res) => {
  return res.sendFile(path.join(__dirname, "../views/error.html"));
});

module.exports = router;
