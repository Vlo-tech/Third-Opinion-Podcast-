require('dotenv').config(); // Load environment variables
console.log("MONGO_URI from .env:", process.env.MONGO_URI);
console.log("Current directory:", process.cwd()); // Check current working directory

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Use Helmet to set secure HTTP headers
app.use(helmet());

// Setup CORS (restrict this to your trusted development domain)
// For example, if you're using Live Server on localhost:5500
app.use(cors({
    origin: ['http://127.0.0.1:5500'], // Adjust this to your actual frontend domain/port
    methods: ['GET', 'POST']
}));

// Middleware for JSON parsing
app.use(bodyParser.json());

// Ensure MONGO_URI is defined
if (!process.env.MONGO_URI) {
    console.error("MongoDB connection string is missing! Check your .env file.");
    process.exit(1);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
    console.error('MongoDB connection failed:', err.message);
});

// Define Episode Schema with validation
const episodeSchema = new mongoose.Schema({
    episodeNumber: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    summary: { type: String, required: true },
    thumbnail: { type: String, required: true },
    audioUrl: { type: String, required: true }
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
