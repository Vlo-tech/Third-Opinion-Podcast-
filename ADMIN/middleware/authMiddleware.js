// admin/middleware/authMiddleware.js

// List of all approved emails and their roles:
const allowedUsers = {
  "businessclasstre@gmail.com":  "admin",   // full control
  "valentinehellen14@gmail.com":      "admin",   // full control
  "Nyabonyitalia@gmail.com":     "editor",  // can add/edit content
  "jm7903739@gmail.com":         "editor",  // can add/edit content
  "thirdopinionp@gmail.com":     "watcher"  // view‐only, receive messages
};



function ensureLoggedIn(req, res, next) {
  if (!req.user || !req.user.email) {
    return res.redirect("/admin/login");
  }
  const role = allowedUsers[req.user.email];
  if (!role) {
    return res.redirect("/admin/error");
  }
  // Save role in session for downstream checks:
  req.session.role = role;
  next();
}


function ensureAdmin(req, res, next) {
  if (req.session.role === "admin") {
    return next();
  }
  return res.redirect("/admin/error");
}


function ensureEditor(req, res, next) {
  const role = req.session.role;
  if (role === "admin" || role === "editor") {
    return next();
  }
  return res.redirect("/admin/error");
}


function ensureViewer(req, res, next) {
  if (req.session.role === "watcher") {
    return next();
  }
  return res.redirect("/admin/error");
}

module.exports = {
  ensureLoggedIn,
  ensureAdmin,
  ensureEditor,
  ensureViewer
};
