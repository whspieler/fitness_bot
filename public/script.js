let progressChart;

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

            if (data.progressData && data.progressData.length > 0) {
                updateProgressChart(data.progressData);
            }
        }
    })
    .catch(error => {
        document.getElementById('loginResponse').innerText = error.message;
    });
});

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

document.getElementById('registerLink').addEventListener('click', function(event) {
    event.preventDefault();
    document.getElementById('loginDiv').style.display = 'none';
    document.getElementById('registerDiv').style.display = 'block';
});

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

document.getElementById('progressTrackingForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const currentWeight = document.getElementById('currentWeight').value;
    const workoutsCompleted = document.getElementById('workoutsCompleted').value;

    fetch('http://localhost:8080/trackProgress', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currentWeight, workoutsCompleted })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('progressResponse').innerText = data.message;
        if (data.success) {
            updateProgressChart(data.progressData);
        }
    })
    .catch(error => {
        document.getElementById('progressResponse').innerText = 'Error updating progress: ' + error.message;
    });
});

function setSection(section) {
    return fetch('http://localhost:8080/setSection', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ section })
    });
}

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

        if (planType === 'dietPlan' && data.updatedPlan) {
            document.getElementById('planContent').innerText = data.updatedPlan;
        }

        if (planType === 'fitnessPlan' && data.updatedPlan) {
            document.getElementById('planContent').innerText = data.updatedPlan;
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

function viewPlan(planType) {
    const planTitle = document.getElementById('planTitle');
    const planContent = document.getElementById('planContent');
    const chatPrompt = document.getElementById('chatPrompt');
    const chatInput = document.getElementById('chatInput');
    const sendChatButton = document.getElementById('sendChatButton');

    document.getElementById('progressTrackingFormDiv').style.display = 'none';

    planContent.innerHTML = '';
    chatResponse.innerText = ''; 
    chatInput.value = '';

    fetch('http://localhost:8080/setSection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: planType })
    });

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
            planTitle.innerText = 'Track Your Progress';
            document.getElementById('progressTrackingFormDiv').style.display = 'block';
            chatPrompt.innerText = '';
            chatInput.style.display = 'none';
            sendChatButton.style.display = 'none';
            break;
        case 'additionalResources':
            planTitle.innerText = 'Additional Resources';
            fetchAdditionalResources();
            chatPrompt.innerText = '';
            chatInput.style.display = 'none';
            sendChatButton.style.display = 'none';
            break;
    }

    document.getElementById('planPreviews').style.display = 'none';
    document.getElementById('planDetails').style.display = 'block';
    document.getElementById('chatbotDiv').style.display = planType === 'progressTracking' || planType === 'additionalResources' ? 'none' : 'block';
    chatInput.style.display = planType === 'progressTracking' || planType === 'additionalResources' ? 'none' : 'block';
    sendChatButton.style.display = planType === 'progressTracking' || planType === 'additionalResources' ? 'none' : 'block';
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

function fetchProgressDataAndUpdateChart() {
    fetch('http://localhost:8080/trackProgress', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.progressData) {
            updateProgressChart(data.progressData);
        }
    })
    .catch(error => {
        console.error('Error fetching progress data:', error.message);
    });
}

function fetchAdditionalResources() {
    fetch('http://localhost:8080/getResources', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const resources = data.resources;
            let contentHtml = '<h3>Workout Videos</h3><ul>';
            const displayedVideoIds = new Set(); // Track displayed video IDs

            // Check for available workout videos and iterate through the nested arrays
            if (resources.exerciseVideos && resources.exerciseVideos.length > 0) {
                resources.exerciseVideos.forEach(videoArray => {
                    videoArray.forEach(video => {
                        if (video.id && video.id.videoId && !displayedVideoIds.has(video.id.videoId)) {
                            contentHtml += `<li><iframe width="560" height="315" src="https://www.youtube.com/embed/${video.id.videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></li>`;
                            displayedVideoIds.add(video.id.videoId); // Add videoId to the set
                        }
                    });
                });
            } else {
                contentHtml += '<li>No workout videos available.</li>';
            }

            contentHtml += '</ul><h3>Recipe Videos</h3><ul>';

            // Check for available recipe videos and iterate through the nested arrays
            if (resources.recipeVideos && resources.recipeVideos.length > 0) {
                resources.recipeVideos.forEach(videoArray => {
                    videoArray.forEach(video => {
                        if (video.id && video.id.videoId && !displayedVideoIds.has(video.id.videoId)) {
                            contentHtml += `<li><iframe width="560" height="315" src="https://www.youtube.com/embed/${video.id.videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></li>`;
                            displayedVideoIds.add(video.id.videoId); // Add videoId to the set
                        }
                    });
                });
            } else {
                contentHtml += '<li>No recipe videos available.</li>';
            }

            contentHtml += '</ul>';
            document.getElementById('planContent').innerHTML = contentHtml;
        } else {
            document.getElementById('planContent').innerText = 'No resources available at the moment.';
        }
    })
    .catch(error => {
        console.error('Error fetching additional resources:', error.message);
        document.getElementById('planContent').innerText = 'Failed to load additional resources.';
    });
}


function displayProgressChart() {
    const ctx = document.createElement('canvas');
    ctx.id = 'progressChart';
    document.getElementById('planContent').innerHTML = '';
    document.getElementById('planContent').appendChild(ctx);

    const config = {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Weight (lbs)',
                data: [],
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {}
    };

    if (progressChart) {
        progressChart.destroy();
    }

    progressChart = new Chart(ctx, config);
}

function updateProgressChart(progressData) {
    if (!progressChart) {
        displayProgressChart();
    }

    const labels = progressData.map((entry, index) => `Week ${index + 1}`);
    const data = progressData.map(entry => entry.weight);

    progressChart.data.labels = labels;
    progressChart.data.datasets[0].data = data;
    progressChart.update();
}

function backToPreviews() {
    document.getElementById('planDetails').style.display = 'none';
    document.getElementById('planPreviews').style.display = 'block';
}
