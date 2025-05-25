require('dotenv').config(); // Load environment variables

if (process.env.NODE_ENV !== 'production') {
  console.log("MONGO_URI from .env:", process.env.MONGO_URI);
  console.log("Current directory:", process.cwd());
}

const express    = require('express');
const bodyParser = require('body-parser');
const cors       = require('cors');
const helmet     = require('helmet');
const mongoose   = require('mongoose');
const path       = require('path');

// Passport.js setup
const session  = require('express-session');
const passport = require('passport');
require('./passport'); // Ensure passport.js is in the same directory

// Use connect‐mongo for session storage
const MongoStore = require('connect-mongo');

// M-Pesa helper
const { lipaNaMpesa } = require('./mpesa');

// PayPal SDK setup
const paypalSDK    = require('@paypal/checkout-server-sdk');
const paypalEnv    = new paypalSDK.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_SECRET
);
const paypalClient = new paypalSDK.core.PayPalHttpClient(paypalEnv);

// Paystack SDK setup
const Paystack     = require('paystack-api')(process.env.PAYSTACK_SECRET_KEY);

// OpenAI SDK setup (v4)
const OpenAI = require("openai");
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const app  = express();
const PORT = process.env.PORT || 3000;

// 1) Secure HTTP headers
app.use(helmet());

// Express session middleware (required for Passport to work)
// Now storing sessions in MongoDB instead of memory
app.use(
  session({
    secret: process.env.SESSION_SECRET, 
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
  })
);

// Initialize Passport and session
app.use(passport.initialize());
app.use(passport.session());

// 2) CORS: only your dev front-ends
app.use(
  cors({
    origin: [
      'http://127.0.0.1:5500',
      'http://localhost:3000'
    ],
    methods: ['GET','POST'],
    allowedHeaders: ['Content-Type']
  })
);

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

  // 8) Import models
  const Episode = require('./models/Episode');

  

  // ----- BEGIN: SEEDING LOGIC (original callback style) -----
  const seedEpisodes = [
    { episodeNumber: 1, title: "Episode 1: A New Beginning", summary: "Dive into our first episode where we explore the journey of the Third Opinion Podcast and how we came to be.", thumbnail: "http://localhost:3000/public/images/Episodecardimage.png", audioUrl: "https://example.com/audio1.mp3" },
    { episodeNumber: 2, title: "Episode 2: The Journey Continues", summary: "In this episode, we delve deeper into what Third Opinion Podcast has to offer.", thumbnail: "http://localhost:3000/public/images/Episodecardimage.png", audioUrl: "https://example.com/audio2.mp3" },
    { episodeNumber: 3, title: "Episode 3: New Horizons", summary: "Join us as we discuss trending topics around the media and how it affects us as young people.", thumbnail: "http://localhost:3000/public/images/Episodecardimage.png", audioUrl: "https://example.com/audio3.mp3" },
    { episodeNumber: 4, title: "Episode 4: Deep Dive", summary: "Taking a deep dive into endless innovation and creativity, exploring how young people are solving long-term problems.", thumbnail: "http://localhost:3000/public/images/Episodecardimage.png", audioUrl: "https://example.com/audio4.mp3" },
    { episodeNumber: 5, title: "Episode 5: Bonus Content", summary: "Extra insights, behind-the-scenes content, and more surprises.", thumbnail: "http://localhost:3000/public/images/Episodecardimage.png", audioUrl: "https://example.com/audio5.mp3" },
    { episodeNumber: 6, title: "Episode 6: Real Talk", summary: "Diplomatic insights, trending topics, and extra fun in this special edition.", thumbnail: "http://localhost:3000/public/images/Episodecardimage.png", audioUrl: "https://example.com/audio6.mp3" },
    { episodeNumber: 7, title: "Episode 7: New Insights", summary: "Fresh perspectives and new discussions in our ongoing exploration.", thumbnail: "http://localhost:3000/public/images/Episodecardimage.png", audioUrl: "https://example.com/audio7.mp3" },
    { episodeNumber: 8, title: "Episode 8: Special Guest", summary: "An exclusive interview with a special guest. You don't want to miss it!", thumbnail: "http://localhost:3000/public/images/Episodecardimage.png", audioUrl: "https://example.com/audio8.mp3" }
  ];

  try {
    const count = await Episode.countDocuments();
    console.log(`📂 Current episodes count: ${count}`);
    if (count === 0) {
      await Episode.insertMany(seedEpisodes);
      console.log("🌱 Seeded 8 episodes!");
    } else {
      console.log("📦 Episodes already seeded (skipping).");
    }
  } catch (e) {
    console.error("Error counting/seeding episodes:", e);
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

  // 12) MPESA callback endpoints
  app.get('/api/mpesa/callback', (req, res) => {
    res.send('✅ MPESA callback endpoint (GET)');
  });
  app.post('/api/mpesa/callback', (req, res) => {
    console.log('✅ M-Pesa callback received:', JSON.stringify(req.body, null, 2));
    res.status(200).send('Callback received');
  });

  // ——— PayPal endpoints ———
  app.post('/api/paypal/create-order', async (req, res) => {
    const { amount } = req.body;
    const request    = new paypalSDK.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [{ amount: { currency_code: "USD", value: amount.toString() } }]
    });
    try {
      const order = await paypalClient.execute(request);
      res.json(order.result);
    } catch (err) {
      console.error("PayPal create-order error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/paypal/capture-order', async (req, res) => {
    const { orderID } = req.body;
    const request     = new paypalSDK.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});
    try {
      const capture = await paypalClient.execute(request);
      res.json(capture.result);
    } catch (err) {
      console.error("PayPal capture-order error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ——— Paystack initialize & verify ———
  app.post('/api/paystack/initialize', async (req, res) => {
    const { email, amount } = req.body;
    if (!email || !amount) {
      return res.status(400).json({ status: false, message: 'email and amount required' });
    }
    try {
      const init = await Paystack.transaction.initialize({
        email,
        amount: amount * 100  // in kobo
      });
      res.json(init);
    } catch (err) {
      console.error('Paystack init error:', err);
      res.status(500).json({ status: false, message: err.message });
    }
  });

  app.get('/api/paystack/verify/:reference', async (req, res) => {
    try {
      const verification = await Paystack.transaction.verify({
        reference: req.params.reference
      });
      res.json(verification);
    } catch (err) {
      console.error('Paystack verify error:', err);
      res.status(500).json({ status: false, message: err.message });
    }
  });

  app.post('/api/paystack/webhook', (req, res) => {
    console.log('✅ Paystack webhook received:', JSON.stringify(req.body, null, 2));
    res.sendStatus(200);
  });

  // ——— OpenAI Chat endpoint ———
  app.post('/api/chat', async (req, res) => {
    try {
      const { message } = req.body;
      const completion  = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful assistant for the Third Opinion Podcast website." },
          { role: "user",   content: message }
        ]
      });
      res.json({ reply: completion.choices[0].message.content });
    } catch (err) {
      console.error("OpenAI chat error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 14) Google OAuth routes
  app.get(
    '/auth/google', 
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get(
    '/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
      // After successful OAuth, redirect to dashboard
      res.redirect('/admin/dashboard');
    }
  );

  // ——— NEW SECTION: Google ID token verification (GIS flow) ———
  const { OAuth2Client } = require('google-auth-library');
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  app.post('/auth/google/verify', async (req, res) => {
    const { id_token } = req.body;

    try {
      const ticket = await client.verifyIdToken({
        idToken: id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      const User = require('./models/user');
      let user = await User.findOne({ googleId: payload.sub });
      if (!user) {
        user = await User.create({
          googleId: payload.sub,
          email:    payload.email,
          name:     payload.name,
          photoUrl: payload.picture,
          role:     'user' // default role; adjust later in admin panel
        });
      }
      req.session.user = {
        email:    user.email,
        role:     user.role,
        name:     user.name,
        photoUrl: user.photoUrl
      };
      return res.json({ success: true });
    } catch (error) {
      console.error('Google ID token verification failed:', error);
      return res.status(401).json({ success: false, message: 'Invalid ID token' });
    }
  });

  // 15) Return current user info
  app.get('/api/current-user', (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Not logged in' });
    }
    const { email, role, name, photoUrl } = req.session.user;
    res.json({ email, role: role || 'user', name, photoUrl });
  });

  // 16) Mount admin routes
  const adminRoutes = require('./ADMIN/routes/adminRoutes');
  app.use('/admin', adminRoutes);

  // 17) Start listening
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
})
.catch(err => {
  console.error('❌ MongoDB connection failed:', err.message);
  process.exit(1);
});





