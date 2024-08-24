function toggleContent(id) {
    var content = document.getElementById(id);
    if (content.style.display === "none" || content.style.display === "") {
        content.style.display = "block";
    } else {
        content.style.display = "none";
    }
}

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
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.message || 'Login failed');
            });
        }
        return response.json();
    })
    .then(data => {
        document.getElementById('loginResponse').innerText = data.message;
        if (data.success) {
            document.getElementById('loginDiv').style.display = 'none';
            document.getElementById('registerDiv').style.display = 'none';
            document.getElementById('intro').style.display = 'none';

            if (data.fitnessData && Object.keys(data.fitnessData).length > 0) {
                // If fitness data exists, show plan previews directly
                document.getElementById('planPreviews').style.display = 'block';

                document.getElementById('fitnessPlanText').innerText = 'Loading...';
                document.getElementById('dietPlanText').innerText = 'Loading...';
                document.getElementById('progressTrackingText').innerText = 'Loading...';

                getDietPlan(data.fitnessData.goal, data.fitnessData.weight, data.fitnessData.gender, data.fitnessData.age, data.fitnessData.fitnessLevel);
                getWorkoutRoutine(data.fitnessData.bodyType, data.fitnessData.exerciseDays, data.fitnessData.fitnessLevel);
                trackProgress(data.fitnessData.goal, data.fitnessData.weight, data.fitnessData.gender, data.fitnessData.age, data.fitnessData.fitnessLevel);
            } else {
                // If no fitness data, show the fitness form
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

            // Automatically get diet plan, workout routine, etc.
            getDietPlan(goal, weight, gender, age, fitnessLevel);
            getWorkoutRoutine(bodyType, exerciseDays, fitnessLevel);
            trackProgress(goal, weight, gender, age, fitnessLevel);
        } else {
            document.getElementById('response').innerText = 'Error: ' + data.message;
        }
    })
    .catch(error => {
        document.getElementById('response').innerText = 'Error: ' + error.message;
    });
});

function getDietPlan(goal, weight, gender, age, fitnessLevel) {
    const query = `${goal} diet plan for ${gender}, ${age} years old, ${weight} lbs, ${fitnessLevel} fitness level`;

    fetch('http://localhost:8080/getDietPlan', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('dietPlanText').innerText = data.dietPlan || 'Diet plan not available.';
    })
    .catch(error => {
        document.getElementById('dietPlanText').innerText = 'Error fetching diet plan: ' + error.message;
    });
}

function getWorkoutRoutine(bodyType, exerciseDays, fitnessLevel) {
    const query = `workout routine for ${bodyType}, ${exerciseDays} days per week, ${fitnessLevel} fitness level`;

    fetch('http://localhost:8080/getWorkoutRoutine', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('fitnessPlanText').innerText = data.workoutRoutine || 'Workout routine not available.';
    })
    .catch(error => {
        document.getElementById('fitnessPlanText').innerText = 'Error fetching workout routine: ' + error.message;
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

    switch(planType) {
        case 'fitnessPlan':
            planTitle.innerText = 'Fitness Plan';
            planContent.innerText = document.getElementById('fitnessPlanText').innerText;
            break;
        case 'dietPlan':
            planTitle.innerText = 'Diet Plan';
            planContent.innerText = document.getElementById('dietPlanText').innerText;
            break;
        case 'progressTracking':
            planTitle.innerText = 'Progress Tracking';
            planContent.innerText = document.getElementById('progressTrackingText').innerText;
            break;
    }

    document.getElementById('planPreviews').style.display = 'none';
    document.getElementById('planDetails').style.display = 'block';
}

function backToPreviews() {
    document.getElementById('planDetails').style.display = 'none';
    document.getElementById('planPreviews').style.display = 'block';
}
