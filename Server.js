require('dotenv').config(); // Load environment variables
console.log("MONGO_URI from .env:", process.env.MONGO_URI);
console.log("Current directory:", process.cwd());

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const path = require('path');


// import our helper
const { lipaNaMpesa } = require('./mpesa');

const app = express();
const PORT = process.env.PORT || 3000;

// Use Helmet for secure HTTP headers
app.use(helmet());

// Setup CORS (adjust the origin to match your front-end; here it's set to port 5500 and localhost:3000)
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

// Middleware for JSON parsing
app.use(bodyParser.json());


// Serve static files from the "Tajova web images" directory
app.use('/public/images', express.static(path.join(__dirname, 'public images'), {
  setHeaders: (res, filePath) => {
    console.log(`Serving file: ${filePath}`);
    // Allow the image to be loaded cross-origin
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  }
}));


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
.then(() => {
    console.log('✅ MongoDB connected successfully');

    // Define Episode Schema with validation (thumbnail is required and uses an absolute URL)
    const episodeSchema = new mongoose.Schema({
        episodeNumber: { type: Number, required: true, unique: true },
        title:         { type: String, required: true },
        summary:       { type: String, required: true },
        thumbnail:     { type: String, required: true },
        audioUrl:      { type: String, required: true }
    });

    const Episode = mongoose.model('Episode', episodeSchema);

    // ----- BEGIN: SEEDING LOGIC -----
    // Sample data for Episodes 1 to 8 with absolute thumbnail URLs
    const seedEpisodes = [
      {
        episodeNumber: 1,
        title: "Episode 1: A New Beginning",
        summary: "Dive into our first episode where we explore the journey of the Third Opinion Podcast and how we came to be.",
        thumbnail: "http://localhost:3000/public/images/Episodecardimage.png",
        audioUrl: "https://example.com/audio1.mp3"
      },
      {
        episodeNumber: 2,
        title: "Episode 2: The Journey Continues",
        summary: "In this episode, we delve deeper into what Third Opinion Podcast has to offer.",
        thumbnail: "http://localhost:3000/public/images/Episodecardimage.png",
        audioUrl: "https://example.com/audio2.mp3"
      },
      {
        episodeNumber: 3,
        title: "Episode 3: New Horizons",
        summary: "Join us as we discuss trending topics around the media and how it affects us as young people.",
        thumbnail: "http://localhost:3000/public/images/Episodecardimage.png",
        audioUrl: "https://example.com/audio3.mp3"
      },
      {
        episodeNumber: 4,
        title: "Episode 4: Deep Dive",
        summary: "Taking a deep dive into endless innovation and creativity, exploring how young people are solving long-term problems.",
        thumbnail: "http://localhost:3000/public/images/Episodecardimage.png",
        audioUrl: "https://example.com/audio4.mp3"
      },
      {
        episodeNumber: 5,
        title: "Episode 5: Bonus Content",
        summary: "Extra insights, behind-the-scenes content, and more surprises.",
        thumbnail: "http://localhost:3000/public/images/Episodecardimage.png",
        audioUrl: "https://example.com/audio5.mp3"
      },
      {
        episodeNumber: 6,
        title: "Episode 6: Real Talk",
        summary: "Diplomatic insights, trending topics, and extra fun in this special edition.",
        thumbnail: "http://localhost:3000/public/images/Episodecardimage.png",
        audioUrl: "https://example.com/audio6.mp3"
      },
      {
        episodeNumber: 7,
        title: "Episode 7: New Insights",
        summary: "Fresh perspectives and new discussions in our ongoing exploration.",
        thumbnail: "http://localhost:3000/public/images/Episodecardimage.png",
        audioUrl: "https://example.com/audio7.mp3"
      },
      {
        episodeNumber: 8,
        title: "Episode 8: Special Guest",
        summary: "An exclusive interview with a special guest. You don't want to miss it!",
        thumbnail: "http://localhost:3000/public/images/Episodecardimage.png",
        audioUrl: "https://example.com/audio8.mp3"
      }
    ];

    // Updated seeding logic using promises
    Episode.countDocuments({})
      .then(count => {
          if (count === 0) {
              return Episode.insertMany(seedEpisodes)
                  .then(() => console.log("Seeded 8 episodes!"))
                  .catch(err => console.error("Error seeding episodes:", err));
          } else {
              console.log("Episodes already seeded, count:", count);
          }
      })
      .catch(err => console.error("Error counting documents:", err));

    // ----- END: SEEDING LOGIC -----

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

    // Finally, start listening after the DB logic is set
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

})
.catch(err => {
    console.error('MongoDB connection failed:', err.message);
});

// POST /api/mpesa/pay
app.post('/api/mpesa/pay', async (req, res) => {
  const { phone, amount, accountRef, desc } = req.body;
  if (!phone || !amount) {
    return res.status(400).json({ error: "phone and amount are required" });
  }

  try {
    const result = await lipaNaMpesa({ phone, amount, accountRef, desc });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Mpesa error:", err);
    res.status(500).json({ error: err.message });
  }
});
