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
            document.getElementById('fitnessFormDiv').style.display = 'block';
            document.getElementById('loginDiv').style.display = 'none';
            document.getElementById('registerDiv').style.display = 'none';
            document.getElementById('intro').style.display = 'none';

            // Prefill fitness form with existing data
            if (data.fitnessData) {
                document.getElementById('goal').value = data.fitnessData.goal || '';
                document.getElementById('bodyType').value = data.fitnessData.bodyType || '';
                document.getElementById('weight').value = data.fitnessData.weight || '';
                document.getElementById('exerciseDays').value = data.fitnessData.exerciseDays || '';
                document.getElementById('age').value = data.fitnessData.age || '';
                document.getElementById('gender').value = data.fitnessData.gender || '';
                document.getElementById('fitnessLevel').value = data.fitnessData.fitnessLevel || '';
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
            document.getElementById('loginResponse').innerText = 'You can now log in with your new account.';
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
        document.getElementById('response').innerText = data.message;

        // Automatically get diet plan, workout routine, etc. after form submission
        if (data.success) {
            getDietPlan(goal, weight, gender, age, fitnessLevel);
            getWorkoutRoutine(bodyType, exerciseDays, fitnessLevel);
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
        document.getElementById('response').innerText += `\nDiet Plan: ${data.dietPlan}`;
    })
    .catch(error => {
        document.getElementById('response').innerText += '\nError fetching diet plan: ' + error.message;
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
        document.getElementById('response').innerText += `\nWorkout Routine: ${data.workoutRoutine}`;
    })
    .catch(error => {
        document.getElementById('response').innerText += '\nError fetching workout routine: ' + error.message;
    });
}
