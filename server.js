require('dotenv').config();

const express = require('express');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');

const { CloudAdapter, MemoryStorage, ConversationState, UserState } = require('botbuilder');
const restify = require('restify');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/fitnessBot', { useNewUrlParser: true, useUnifiedTopology: true });

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
        fitnessLevel: String
    }
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
        res.json({ message: 'Login successful', success: true, fitnessData: user.fitnessData });
    } catch (error) {
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

// --- Azure Bot Integration Starts Here ---

const adapter = new CloudAdapter({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage);
const userState = new UserState(memoryStorage);

class FitnessBot {
    async onTurn(turnContext) {
        if (turnContext.activity.type === 'message') {
            const userInput = turnContext.activity.text.toLowerCase();

            if (userInput.includes('workout')) {
                await turnContext.sendActivity('Here’s a workout plan for you!');
            } else if (userInput.includes('diet')) {
                await turnContext.sendActivity('Here’s a diet plan for you!');
            } else if (userInput.includes('food') || userInput.includes('calories')) {
                const response = await callNutritionixAPI(userInput);
                await turnContext.sendActivity(response);
            } else {
                const response = await callGroqAPI(userInput);
                await turnContext.sendActivity(response);
            }
        }
    }
}

const bot = new FitnessBot();

const restifyServer = restify.createServer();
restifyServer.listen(3978, () => {
    console.log(`\n${restifyServer.name} listening to ${restifyServer.url}`);
});

restifyServer.post('/api/messages', (req, res) => {
    adapter.processActivity(req, res, async (context) => {
        await bot.onTurn(context);
    });
});

// Function to call Groq API
async function callGroqAPI(inputText) {
    try {
        const response = await axios.post('https://api.groq.com/v1/chat/completions', {
            prompt: inputText,
            max_tokens: 150
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
            }
        });

        return response.data.choices[0].text.trim();
    } catch (error) {
        console.error('Error calling Groq API:', error);
        return 'Sorry, something went wrong.';
    }
}

// Function to call Nutritionix API
async function callNutritionixAPI(query) {
    try {
        const response = await axios.get('https://trackapi.nutritionix.com/v2/natural/nutrients', {
            params: {
                query: query
            },
            headers: {
                'x-app-id': process.env.NUTRITIONIX_APP_ID,
                'x-app-key': process.env.NUTRITIONIX_APP_KEY
            }
        });

        const data = response.data;
        if (data.foods && data.foods.length > 0) {
            const food = data.foods[0];
            return `Food: ${food.food_name}, Calories: ${food.nf_calories}, Protein: ${food.nf_protein}g, Fat: ${food.nf_total_fat}g, Carbs: ${food.nf_total_carbohydrate}g`;
        } else {
            return 'No nutritional information found.';
        }
    } catch (error) {
        console.error('Error calling Nutritionix API:', error);
        return 'Sorry, something went wrong with the nutrition information.';
    }
}

// Bot Integration Ends Here ---

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
