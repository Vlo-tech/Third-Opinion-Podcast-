require('dotenv').config(); // Load environment variables
console.log("MONGO_URI from .env:", process.env.MONGO_URI);
console.log("Current directory:", process.cwd());

const express       = require('express');
const bodyParser    = require('body-parser');
const cors          = require('cors');
const helmet        = require('helmet');
const mongoose      = require('mongoose');
const path          = require('path');

// M-Pesa helper
const { lipaNaMpesa } = require('./mpesa');

const app  = express();
const PORT = process.env.PORT || 3000;

// 1) Secure HTTP headers
app.use(helmet());

// 2) CORS: only your dev front-ends
app.use(cors({
  origin: [
    'http://127.0.0.1:5500',
    'http://localhost:3000'
  ],
  methods: ['GET','POST'],
  allowedHeaders: ['Content-Type']
}));

// 3) JSON body parsing
app.use(bodyParser.json());

// 4) Root health-check (avoids 404 on "/")
app.get('/', (req, res) => {
  res.send('✅ Third Opinion Podcast API is up and running!');
});

// 5) Serve static images from "./public images"
app.use(
  '/public/images',
  express.static(path.join(__dirname, 'public images'), {
    setHeaders: (res, filePath) => {
      console.log(`Serving file: ${filePath}`);
      // Allow these static images to be used cross-origin
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    }
  })
);

// 6) Ensure MONGO_URI is defined
if (!process.env.MONGO_URI) {
  console.error("❌ MongoDB connection string is missing! Check your .env file.");
  process.exit(1);
}

// 7) Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('✅ MongoDB connected successfully');

  // 8) Define Episode schema + model
  const episodeSchema = new mongoose.Schema({
    episodeNumber: { type: Number, required: true, unique: true },
    title:         { type: String, required: true },
    summary:       { type: String, required: true },
    thumbnail:     { type: String, required: true },
    audioUrl:      { type: String, required: true }
  });
  const Episode = mongoose.model('Episode', episodeSchema);

  // ----- BEGIN: SEEDING LOGIC (promise/async) -----
  const seedEpisodes = [
    {
      episodeNumber: 1,
      title:   "Episode 1: A New Beginning",
      summary: "Dive into our first episode where we explore the journey of the Third Opinion Podcast and how we came to be.",
      thumbnail: "http://localhost:3000/public/images/Episodecardimage.png",
      audioUrl:  "https://example.com/audio1.mp3"
    },
    {
      episodeNumber: 2,
      title:   "Episode 2: The Journey Continues",
      summary: "In this episode, we delve deeper into what Third Opinion Podcast has to offer.",
      thumbnail: "http://localhost:3000/public/images/Episodecardimage.png",
      audioUrl:  "https://example.com/audio2.mp3"
    },
    {
      episodeNumber: 3,
      title:   "Episode 3: New Horizons",
      summary: "Join us as we discuss trending topics around the media and how it affects us as young people.",
      thumbnail: "http://localhost:3000/public/images/Episodecardimage.png",
      audioUrl:  "https://example.com/audio3.mp3"
    },
    {
      episodeNumber: 4,
      title:   "Episode 4: Deep Dive",
      summary: "Taking a deep dive into endless innovation and creativity, exploring how young people are solving long-term problems.",
      thumbnail: "http://localhost:3000/public/images/Episodecardimage.png",
      audioUrl:  "https://example.com/audio4.mp3"
    },
    {
      episodeNumber: 5,
      title:   "Episode 5: Bonus Content",
      summary: "Extra insights, behind-the-scenes content, and more surprises.",
      thumbnail: "http://localhost:3000/public/images/Episodecardimage.png",
      audioUrl:  "https://example.com/audio5.mp3"
    },
    {
      episodeNumber: 6,
      title:   "Episode 6: Real Talk",
      summary: "Diplomatic insights, trending topics, and extra fun in this special edition.",
      thumbnail: "http://localhost:3000/public/images/Episodecardimage.png",
      audioUrl:  "https://example.com/audio6.mp3"
    },
    {
      episodeNumber: 7,
      title:   "Episode 7: New Insights",
      summary: "Fresh perspectives and new discussions in our ongoing exploration.",
      thumbnail: "http://localhost:3000/public/images/Episodecardimage.png",
      audioUrl:  "https://example.com/audio7.mp3"
    },
    {
      episodeNumber: 8,
      title:   "Episode 8: Special Guest",
      summary: "An exclusive interview with a special guest. You don't want to miss it!",
      thumbnail: "http://localhost:3000/public/images/Episodecardimage.png",
      audioUrl:  "https://example.com/audio8.mp3"
    }
  ];

  try {
    const count = await Episode.countDocuments();
    if (count === 0) {
      await Episode.insertMany(seedEpisodes);
      console.log("🌱 Seeded 8 episodes!");
    } else {
      console.log(`📦 Episodes already seeded (count: ${count})`);
    }
  } catch (seedErr) {
    console.error("Error counting or seeding episodes:", seedErr);
  }
  // ----- END: SEEDING LOGIC -----

  // 9) Episode API endpoints
  app.get('/api/episodes', async (req, res) => {
    try {
      const episodes = await Episode.find({}).sort({ episodeNumber: 1 });
      res.json(episodes);
    } catch (err) {
      console.error("Error fetching episodes:", err);
      res.status(500).json({ message: 'Error fetching episodes' });
    }
  });

  app.post('/api/episodes', async (req, res) => {
    try {
      const newEpisode = new Episode(req.body);
      await newEpisode.save();
      res.status(201).json({ message: 'Episode added successfully!' });
    } catch (err) {
      console.error("Error saving episode:", err);
      res.status(500).json({ message: 'Error saving episode' });
    }
  });

  // 10) Lead capture (in-memory)
  let leads = [];
  app.post('/api/leads', (req, res) => {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and Email are required.' });
    }
    leads.push({ name, email, submittedAt: new Date() });
    res.status(201).json({ message: 'Lead captured successfully!' });
  });

  // 11) M-Pesa STK Push endpoint
  app.post('/api/mpesa/pay', async (req, res) => {
    const { phone, amount, accountRef, desc } = req.body;
    if (!phone || !amount) {
      console.warn('⚠ /api/mpesa/pay missing phone or amount', { phone, amount });
      return res.status(400).json({ error: "phone and amount are required" });
    }
    console.log('📲 /api/mpesa/pay received:', { phone, amount, accountRef, desc });
    try {
      const result = await lipaNaMpesa({ phone, amount, accountRef, desc });
      console.log('✅ STK Push success response:', result);
      return res.json({ success: true, data: result });
    } catch (err) {
      console.error('❌ STK Push failed:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // 12) MPESA callback endpoints
  app.get('/api/mpesa/callback',  (req, res) => res.send('✅ MPESA callback endpoint (GET)'));
  app.post('/api/mpesa/callback', (req, res) => {
    console.log('✅ M-Pesa callback received:', JSON.stringify(req.body, null, 2));
    res.status(200).send('Callback received');
  });

  // 13) Start listening
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });

})
.catch(err => {
  console.error('❌ MongoDB connection failed:', err.message);
  process.exit(1);
});




