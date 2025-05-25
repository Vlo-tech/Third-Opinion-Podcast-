// admin/controllers/adminController.js

const User = require("../../models/user");
const Episode = require("../../models/Episode");

module.exports = {
  

    
  getStats: async (req, res) => {
    try {
      const userCount = await User.countDocuments();
      const episodeCount = await Episode.countDocuments();
      return res.json({ userCount, episodeCount });
    } catch (err) {
      console.error("Error fetching stats:", err);
      return res.status(500).json({ error: "Unable to fetch stats" });
    }
    },

  renderEditorData: async (req, res) => {
    // You can return JSON or just render a page.
    return res.json({ message: "Editor endpoint — implement as needed." });
  }
};
