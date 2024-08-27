// Handle login form submission
document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault(); 

    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    fetch('http://localhost:8080/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('loginResponse').innerText = data.message;
        if (data.success) {
            document.getElementById('loginDiv').style.display = 'none';
            document.getElementById('registerDiv').style.display = 'none';
            document.getElementById('intro').style.display = 'none';

            if (data.fitnessData && Object.keys(data.fitnessData).length > 0) {
                document.getElementById('planPreviews').style.display = 'block';
            } else {
                document.getElementById('fitnessFormDiv').style.display = 'block';
            }
        }
    })
    .catch(error => {
        document.getElementById('loginResponse').innerText = error.message;
    });
});

// Handle registration form submission
document.getElementById('registerForm').addEventListener('submit', function(event) {
    event.preventDefault(); 

    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;

    fetch('http://localhost:8080/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('registerResponse').innerText = data.message;
        if (data.success) {
            document.getElementById('loginResponse').innerText = 'Registration successful. Please log in with your new account.';
            document.getElementById('registerDiv').style.display = 'none';
            document.getElementById('loginDiv').style.display = 'block';
        }
    })
    .catch(error => {
        document.getElementById('registerResponse').innerText = 'Registration failed: ' + error.message;
    });
});

// Handle register link click to switch to registration form
document.getElementById('registerLink').addEventListener('click', function(event) {
    event.preventDefault();
    document.getElementById('loginDiv').style.display = 'none';
    document.getElementById('registerDiv').style.display = 'block';
});

// Handle fitness form submission
document.getElementById('fitnessForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const goal = document.getElementById('goal').value;
    const bodyType = document.getElementById('bodyType').value;
    const weight = document.getElementById('weight').value;
    const exerciseDays = document.getElementById('exerciseDays').value;
    const age = document.getElementById('age').value;
    const gender = document.getElementById('gender').value;
    const fitnessLevel = document.getElementById('fitnessLevel').value;

    fetch('http://localhost:8080/saveFitnessData', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ goal, bodyType, weight, exerciseDays, age, gender, fitnessLevel })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('fitnessFormDiv').style.display = 'none';
            document.getElementById('planPreviews').style.display = 'block';

            generateAndSavePlans({ goal, bodyType, weight, exerciseDays, age, gender, fitnessLevel });
        } else {
            document.getElementById('response').innerText = 'Error: ' + data.message;
        }
    })
    .catch(error => {
        document.getElementById('response').innerText = 'Error: ' + error.message;
    });
});

// Function to handle chat input for fitness or diet plan
function handleChatInput(planType) {
    const chatInput = document.getElementById('chatInput').value;

    fetch('http://localhost:8080/chatbot', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: chatInput })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('chatResponse').innerText = data.response;

        // Update the plan content directly in the displayed plan content area
        if (planType === 'dietPlan' && data.updatedDietPlan) {
            document.getElementById('planContent').innerText = data.updatedDietPlan;
        }

        if (planType === 'fitnessPlan' && data.updatedWorkoutPlan) {
            document.getElementById('planContent').innerText = data.updatedWorkoutPlan;
        }
    })
    .catch(error => {
        document.getElementById('chatResponse').innerText = 'Error processing request: ' + error.message;
    });
}

function generateAndSavePlans(fitnessData) {
    getDietPlan(fitnessData.goal, fitnessData.weight, fitnessData.gender, fitnessData.age, fitnessData.fitnessLevel)
        .then(dietPlan => {
            return getWorkoutRoutine(fitnessData.bodyType, fitnessData.exerciseDays, fitnessData.fitnessLevel)
                .then(workoutRoutine => {
                    return fetch('http://localhost:8080/saveGeneratedPlans', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ dietPlan, workoutRoutine })
                    });
                });
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                console.error('Error saving generated plans:', data.message);
            }
        })
        .catch(error => {
            console.error('Error generating or saving plans:', error.message);
        });
}

function getDietPlan(goal, weight, gender, age, fitnessLevel) {
    const query = `${goal} diet plan for ${gender}, ${age} years old, ${weight} lbs, ${fitnessLevel} fitness level`;

    return fetch('http://localhost:8080/getDietPlan', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
    })
    .then(response => response.json())
    .then(data => data.dietPlan || 'Diet plan not available.')
    .catch(error => {
        console.error('Error fetching diet plan:', error.message);
        return 'Error fetching diet plan.';
    });
}

function getWorkoutRoutine(bodyType, exerciseDays, fitnessLevel) {
    const query = `workout routine for ${bodyType}, ${exerciseDays} days per week, ${fitnessLevel} fitness level`;

    return fetch('http://localhost:8080/getWorkoutRoutine', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
    })
    .then(response => response.json())
    .then(data => data.workoutRoutine || 'Workout routine not available.')
    .catch(error => {
        console.error('Error fetching workout routine:', error.message);
        return 'Error fetching workout routine.';
    });
}

function trackProgress(goal, weight, gender, age, fitnessLevel) {
    fetch('http://localhost:8080/trackProgress', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ goal, weight, gender, age, fitnessLevel })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('progressTrackingText').innerText = data.progress || 'No progress data available.';
    })
    .catch(error => {
        document.getElementById('progressTrackingText').innerText = 'Error fetching progress: ' + error.message;
    });
}

function viewPlan(planType) {
    const planTitle = document.getElementById('planTitle');
    const planContent = document.getElementById('planContent');
    const chatPrompt = document.getElementById('chatPrompt');
    const chatInput = document.getElementById('chatInput');
    const sendChatButton = document.getElementById('sendChatButton');

    switch(planType) {
        case 'fitnessPlan':
            planTitle.innerText = 'Fitness Plan';
            fetchCurrentPlanContent('fitnessPlan');
            chatPrompt.innerText = 'Please let me know if you would like me to make any modifications to your workout routine:';
            sendChatButton.onclick = function() { handleChatInput('fitnessPlan'); };
            break;
        case 'dietPlan':
            planTitle.innerText = 'Diet Plan';
            fetchCurrentPlanContent('dietPlan');
            chatPrompt.innerText = 'Please let me know if you would like me to make any modifications to your diet plan:';
            sendChatButton.onclick = function() { handleChatInput('dietPlan'); };
            break;
        case 'progressTracking':
            planTitle.innerText = 'Progress Tracking';
            planContent.innerText = 'Progress tracking data will appear here...';
            chatPrompt.innerText = '';
            chatInput.style.display = 'none';
            sendChatButton.style.display = 'none';
            break;
    }

    document.getElementById('planPreviews').style.display = 'none';
    document.getElementById('planDetails').style.display = 'block';
    document.getElementById('chatbotDiv').style.display = planType === 'progressTracking' ? 'none' : 'block';
    chatInput.style.display = planType === 'progressTracking' ? 'none' : 'block';
    sendChatButton.style.display = planType === 'progressTracking' ? 'none' : 'block';
}

function fetchCurrentPlanContent(planType) {
    fetch('http://localhost:8080/getPlans', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (planType === 'fitnessPlan') {
                document.getElementById('planContent').innerText = data.fitnessData.savedWorkoutPlan || 'No workout plan available.';
            } else if (planType === 'dietPlan') {
                document.getElementById('planContent').innerText = data.fitnessData.savedDietPlan || 'No diet plan available.';
            }
        }
    })
    .catch(error => {
        console.error('Error fetching plans:', error.message);
    });
}

function backToPreviews() {
    document.getElementById('planDetails').style.display = 'none';
    document.getElementById('planPreviews').style.display = 'block';
}
