const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// In-memory store for leads (for demonstration)
let leads = [];

// API endpoint for lead capture
app.post('/api/leads', (req, res) => {
    const { name, email } = req.body;
    if (!name || !email) {
        return res.status(400).json({ message: 'Name and Email are required.' });
    }
    leads.push({ name, email, submittedAt: new Date() });
    res.status(201).json({ message: 'Lead captured successfully!' });
});

// (Optional) API endpoint for retrieving leads - secure in production!
app.get('/api/leads', (req, res) => {
    res.json(leads);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
