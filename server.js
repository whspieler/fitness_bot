require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');
const mongoose = require('mongoose');
const Groq = require('groq-sdk');
const axios = require('axios');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/fitnessBot')
    .then(() => console.log('Connected to MongoDB'))
    .catch(error => {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    });

// Define Schemas
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

// Registration endpoint
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

// Login endpoint
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
        req.session.currentSection = ''; // Initialize the current section (diet or workout)
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

// Endpoint to track which section the user is in (diet or workout)
app.post('/setSection', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { section } = req.body; // "dietPlan" or "fitnessPlan"
    req.session.currentSection = section; // Set the current section
    res.json({ message: `Section set to ${section}` });
});

// Save fitness data endpoint
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

// Save generated plans endpoint
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

// Chatbot for modifying diet and workout plans based on current section
app.post('/chatbot', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const { message } = req.body;
        const user = await User.findById(req.session.userId);

        // Collect user preferences and current section
        const userContext = `
        User's Preferences:
        - Goal: ${user.fitnessData.goal || 'Not specified'}
        - Body Type: ${user.fitnessData.bodyType || 'Not specified'}
        - Weight: ${user.fitnessData.weight || 'Not specified'}
        - Exercise Days: ${user.fitnessData.exerciseDays || 'Not specified'}
        - Age: ${user.fitnessData.age || 'Not specified'}
        - Gender: ${user.fitnessData.gender || 'Not specified'}
        - Fitness Level: ${user.fitnessData.fitnessLevel || 'Not specified'}
        
        Existing Plans:
        - Diet Plan: ${user.fitnessData.savedDietPlan || 'Not specified'}
        - Workout Plan: ${user.fitnessData.savedWorkoutPlan || 'Not specified'}
        `;

        let updatedPlan = null;
        const section = req.session.currentSection;

        if (section === 'dietPlan') {
            const dietPrompt = `${userContext}\nPlease update the diet plan based on the following request: ${message}`;
            updatedPlan = await callGroqAPI(dietPrompt);
            console.log('Diet Plan API Response:', updatedPlan);

            if (!updatedPlan || updatedPlan.includes("error")) {
                throw new Error('Failed to generate a valid diet plan.');
            }

            user.fitnessData.savedDietPlan = updatedPlan;

        } else if (section === 'fitnessPlan') {
            const workoutPrompt = `${userContext}\nPlease update the workout plan based on the following request: ${message}`;
            updatedPlan = await callGroqAPI(workoutPrompt);
            console.log('Workout Plan API Response:', updatedPlan);

            if (!updatedPlan || updatedPlan.includes("error")) {
                throw new Error('Failed to generate a valid workout plan.');
            }

            user.fitnessData.savedWorkoutPlan = updatedPlan;
        } else {
            return res.status(400).json({ message: 'Current section is not set. Unable to determine whether to update the diet or workout plan.' });
        }

        // Save updated plan
        await user.save();

        res.json({
            response: 'Your preferences have been updated and a new plan has been generated.',
            updatedPlan: section === 'dietPlan' ? user.fitnessData.savedDietPlan : user.fitnessData.savedWorkoutPlan
        });

    } catch (error) {
        console.error('Error processing chatbot request:', error.message);
        res.status(500).json({ message: 'Failed to process chatbot request: ' + error.message });
    }
});

// Get current plans endpoint
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

// /getDietPlan endpoint
app.post('/getDietPlan', async (req, res) => {
    const { query } = req.body;

    try {
        const dietPlan = await callGroqAPI(`Generate a diet plan: ${query}`);
        res.json({ dietPlan });
    } catch (error) {
        console.error('Error fetching diet plan:', error);
        res.status(500).json({ message: 'Failed to fetch diet plan' });
    }
});

// /getWorkoutRoutine endpoint
app.post('/getWorkoutRoutine', async (req, res) => {
    const { query } = req.body;

    try {
        const workoutRoutine = await callGroqAPI(`Generate a workout routine: ${query}`);
        res.json({ workoutRoutine });
    } catch (error) {
        console.error('Error fetching workout routine:', error);
        res.status(500).json({ message: 'Failed to fetch workout routine' });
    }
});

// Track progress endpoint
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

// Improved logic for YouTube video search based on the plan
app.get('/getResources', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Extract key exercises and meals from user's plans
        const workoutPlan = user.fitnessData.savedWorkoutPlan || '';
        const dietPlan = user.fitnessData.savedDietPlan || '';

        const exercises = extractExercises(workoutPlan);
        const meals = extractMeals(dietPlan);

        const youtubeApiKey = process.env.YOUTUBE_API_KEY;

        // Optimize YouTube searches to limit API calls and reduce quota usage
        const limitedExerciseSearch = exercises.slice(0, 3);  // Limit to 3 exercises
        const limitedMealSearch = meals.slice(0, 3);  // Limit to 3 meals

        // Search for videos concurrently for the limited set
        const exerciseVideosPromises = limitedExerciseSearch.map(exercise => searchYouTube(exercise, youtubeApiKey, 'exercise guide'));
        const mealVideosPromises = limitedMealSearch.map(meal => searchYouTube(meal, youtubeApiKey, 'recipe'));

        const exerciseVideosResponses = await Promise.all(exerciseVideosPromises);
        const mealVideosResponses = await Promise.all(mealVideosPromises);

        const resources = {
            exerciseVideos: exerciseVideosResponses.map(resp => resp.data.items),
            recipeVideos: mealVideosResponses.map(resp => resp.data.items)
        };

        res.json({ success: true, resources });
    } catch (error) {
        console.error('Error fetching YouTube videos:', error);
        res.status(500).json({ message: 'Failed to fetch resources' });
    }
});

// Helper function to extract exercises from workout plans
function extractExercises(workoutPlan) {
    const exercisePattern = /\b(?:bench press|tricep pushdown|pull-ups|squats|deadlifts|leg press|curls|planks|dumbbell fly|lateral raises|barbell rows|cable fly)\b/gi;
    return [...new Set(workoutPlan.match(exercisePattern) || [])]; // Remove duplicates
}

// Helper function to extract meals from diet plans
function extractMeals(dietPlan) {
    const mealPattern = /\b(?:grilled chicken breast|grilled salmon|protein shake|egg whites|whole-grain toast|cottage cheese|quinoa|almonds|casein protein shake)\b/gi;
    return [...new Set(dietPlan.match(mealPattern) || [])]; // Remove duplicates
}

// Helper function to perform YouTube search for given query
async function searchYouTube(query, youtubeApiKey, type) {
    try {
        const searchQuery = `${query} ${type}`;
        return await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                maxResults: 2,  // Reduce max results to conserve quota
                q: searchQuery,
                key: youtubeApiKey
            }
        });
    } catch (error) {
        console.error(`Error searching YouTube for ${query}:`, error);
        throw error;
    }
}

// Initialize Groq API
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Function to call the Groq API for generating plans
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
