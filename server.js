require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');
const mongoose = require('mongoose');
const Groq = require('groq-sdk');
const axios = require('axios');

mongoose.connect('mongodb://localhost:27017/fitnessBot')
    .then(() => console.log('Connected to MongoDB'))
    .catch(error => {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    });

const progressSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    weight: Number,
    workoutsCompleted: Number
});

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: String,
    fitnessData: {
        goal: String,
        bodyType: String,
        weight: Number,
        exerciseDays: Number,
        age: Number,
        gender: String,
        fitnessLevel: String,
        savedWorkoutPlan: String,
        savedDietPlan: String
    },
    progress: [progressSchema]
});

const User = mongoose.model('User', userSchema);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        res.json({ message: 'Registration successful', success: true });
    } catch (error) {
        res.status(400).json({ message: 'Username already taken' });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        req.session.userId = user._id;
        res.json({
            message: 'Login successful',
            success: true,
            fitnessData: user.fitnessData,
            progressData: user.progress
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/saveFitnessData', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const { goal, bodyType, weight, exerciseDays, age, gender, fitnessLevel } = req.body;
        const user = await User.findById(req.session.userId);

        user.fitnessData = { goal, bodyType, weight, exerciseDays, age, gender, fitnessLevel };
        await user.save();

        res.json({ message: 'Fitness data saved successfully', success: true });
    } catch (error) {
        res.status(500).json({ message: 'Failed to save fitness data' });
    }
});

app.post('/saveGeneratedPlans', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const { dietPlan, workoutRoutine } = req.body;
        const user = await User.findById(req.session.userId);

        user.fitnessData.savedDietPlan = dietPlan;
        user.fitnessData.savedWorkoutPlan = workoutRoutine;
        await user.save();

        res.json({ message: 'Generated plans saved successfully', success: true });
    } catch (error) {
        res.status(500).json({ message: 'Failed to save generated plans' });
    }
});

app.post('/chatbot', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const { message } = req.body;
        const user = await User.findById(req.session.userId);

        let updatedDietPlan = null;
        let updatedWorkoutPlan = null;

        if (message.toLowerCase().includes('diet') || message.toLowerCase().includes('eat')) {
            updatedDietPlan = await callGroqAPI(`Generate a new diet plan considering: ${message}`);
            user.fitnessData.savedDietPlan = updatedDietPlan;
        }

        if (message.toLowerCase().includes('workout') || message.toLowerCase().includes('exercise')) {
            updatedWorkoutPlan = await callGroqAPI(`Generate a new workout plan considering: ${message}`);
            user.fitnessData.savedWorkoutPlan = updatedWorkoutPlan;
        }

        await user.save();
        res.json({
            response: 'Your preferences have been updated and a new plan has been generated.',
            updatedDietPlan: user.fitnessData.savedDietPlan,
            updatedWorkoutPlan: user.fitnessData.savedWorkoutPlan
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to process chatbot request' });
    }
});

app.get('/getPlans', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const user = await User.findById(req.session.userId);
        res.json({ success: true, fitnessData: user.fitnessData, progressData: user.progress });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch plans' });
    }
});

app.post('/trackProgress', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const { currentWeight, workoutsCompleted } = req.body;
        const user = await User.findById(req.session.userId);

        user.progress.push({ weight: currentWeight, workoutsCompleted });

        await user.save();

        res.json({ message: 'Progress updated successfully', success: true, progressData: user.progress });
    } catch (error) {
        console.error('Error updating progress:', error);
        res.status(500).json({ message: 'Failed to update progress' });
    }
});

app.get('/getResources', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const fitnessPlanKeywords = user.fitnessData.savedWorkoutPlan.split(' ').slice(0, 3).join(' ');
        const dietPlanKeywords = user.fitnessData.savedDietPlan.split(' ').slice(0, 3).join(' ');

        const youtubeApiKey = process.env.YOUTUBE_API_KEY;

        const workoutVideosResponse = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                maxResults: 5,
                q: `${fitnessPlanKeywords} workout`,
                key: youtubeApiKey
            }
        });

        const dietVideosResponse = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                maxResults: 5,
                q: `${dietPlanKeywords} recipe`,
                key: youtubeApiKey
            }
        });

        const resources = {
            workoutVideos: workoutVideosResponse.data.items,
            recipeVideos: dietVideosResponse.data.items
        };

        res.json({ success: true, resources });
    } catch (error) {
        console.error('Error fetching YouTube videos:', error);
        res.status(500).json({ message: 'Failed to fetch resources' });
    }
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function callGroqAPI(prompt) {
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
            model: "llama3-8b-8192"
        });

        return chatCompletion.choices[0]?.message?.content.trim() || 'No response from API.';
    } catch (error) {
        console.error('Error calling Groq API:', error);
        return 'Sorry, something went wrong.';
    }
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
