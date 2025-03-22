require('dotenv').config(); // Load environment variables
console.log("MONGO_URI from .env:", process.env.MONGO_URI); // Debugging line

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB (ensure .env contains MONGO_URI)
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Define Episode Schema & Model
const episodeSchema = new mongoose.Schema({
    episodeNumber: Number,
    title: String,
    summary: String,
    thumbnail: String,
    audioUrl: String
});

const Episode = mongoose.model('Episode', episodeSchema);

// API endpoint to get all episodes (sorted by episodeNumber)
app.get('/api/episodes', async (req, res) => {
    try {
        const episodes = await Episode.find({}).sort({ episodeNumber: 1 });
        res.json(episodes);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching episodes' });
    }
});

// API endpoint to add a new episode (for admin use)
app.post('/api/episodes', async (req, res) => {
    try {
        const newEpisode = new Episode(req.body);
        await newEpisode.save();
        res.status(201).json({ message: 'Episode added successfully!' });
    } catch (err) {
        res.status(500).json({ message: 'Error saving episode' });
    }
});

// API endpoint for lead capture (existing functionality)
let leads = [];
app.post('/api/leads', (req, res) => {
    const { name, email } = req.body;
    if (!name || !email) {
        return res.status(400).json({ message: 'Name and Email are required.' });
    }
    leads.push({ name, email, submittedAt: new Date() });
    res.status(201).json({ message: 'Lead captured successfully!' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
