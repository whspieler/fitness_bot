require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');
const mongoose = require('mongoose');
const { CloudAdapter, MemoryStorage, ConversationState, UserState } = require('botbuilder');
const restify = require('restify');
const Groq = require('groq-sdk'); // Import the Groq SDK

// Check for required environment variables
const requiredEnvVars = ['MICROSOFT_APP_ID', 'MICROSOFT_APP_PASSWORD', 'GROQ_API_KEY', 'NUTRITIONIX_APP_ID', 'NUTRITIONIX_APP_KEY'];
requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
        console.error(`Environment variable ${varName} is not set.`);
        process.exit(1);
    }
});

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/fitnessBot')
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch(error => {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
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
        console.error('Login error:', error); // Log the actual error
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

// Initialize Groq SDK
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Function to call Groq API using SDK
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

// Endpoint to get diet plan
app.post('/getDietPlan', async (req, res) => {
    const { query } = req.body;
    try {
        const response = await callGroqAPI(`Generate a diet plan for ${query}`);
        res.json({ dietPlan: response });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch diet plan' });
    }
});

// Endpoint to get workout routine
app.post('/getWorkoutRoutine', async (req, res) => {
    const { query } = req.body;
    try {
        const response = await callGroqAPI(`Generate a workout routine for ${query}`);
        res.json({ workoutRoutine: response });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch workout routine' });
    }
});

// Bot Integration
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

            try {
                if (userInput.includes('workout') || userInput.includes('exercise')) {
                    const response = await callGroqAPI(`Generate a workout plan for ${userInput}`);
                    await turnContext.sendActivity(response);
                } else if (userInput.includes('diet') || userInput.includes('meal')) {
                    const response = await callGroqAPI(`Generate a diet plan for ${userInput}`);
                    await turnContext.sendActivity(response);
                } else if (userInput.includes('food') || userInput.includes('calories')) {
                    const response = await callNutritionixAPI(userInput);
                    await turnContext.sendActivity(response);
                } else {
                    await turnContext.sendActivity('Sorry, I didn\'t understand that. Can you please specify if you want workout, diet, or nutritional information?');
                }
            } catch (error) {
                await turnContext.sendActivity('Sorry, something went wrong while processing your request.');
                console.error('Error in bot handling:', error);
            }
        }
    }
}

const bot = new FitnessBot();

const restifyServer = restify.createServer();
restifyServer.listen(3978, () => {
    console.log(`\n${restifyServer.name} listening to ${restifyServer.url}`);
});

restifyServer.post('/api/messages', (req, res, next) => {
    adapter.processActivity(req, res, async (context) => {
        await bot.onTurn(context);
        next(); // Ensure the next middleware in the chain is called
    });
});

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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
