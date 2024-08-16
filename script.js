// Handle Login
document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault(); 

    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => {
        if (response.ok) {
            document.getElementById('loginResponse').innerText = 'Logged in successfully';
            document.getElementById('fitnessFormDiv').style.display = 'block'; // Show the fitness form
            document.getElementById('loginDiv').style.display = 'none'; // Hide the login form
            document.getElementById('registerDiv').style.display = 'none'; // Hide the registration form
        } else {
            return response.json();
        }
    })
    .then(data => {
        if (data) {
            document.getElementById('loginResponse').innerText = data.message;
        }
    });
});

// Handle Registration
document.getElementById('registerForm').addEventListener('submit', function(event) {
    event.preventDefault(); 

    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;

    fetch('/register', {
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
            document.getElementById('registerDiv').style.display = 'none'; // Hide the registration form
            document.getElementById('loginDiv').style.display = 'block'; // Show the login form
        }
    });
});

// Show Registration Form
document.getElementById('registerLink').addEventListener('click', function(event) {
    event.preventDefault();
    document.getElementById('loginDiv').style.display = 'none'; // Hide the login form
    document.getElementById('registerDiv').style.display = 'block'; // Show the registration form
});