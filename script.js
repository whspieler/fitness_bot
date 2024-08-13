document.getElementById('fitnessForm').addEventListener('submit', function(event) {
    event.preventDefault(); 
    // Collect form data
    const goal = document.getElementById('goal').value;
    const bodyType = document.getElementById('bodyType').value;
    const weight = document.getElementById('weight').value;
    const exerciseDays = document.getElementById('exerciseDays').value;
    const age = document.getElementById('age').value;
    const gender = document.getElementById('gender').value;
    const fitnessLevel = document.getElementById('fitnessLevel').value;

    const responseDiv = document.getElementById('response');

   
    responseDiv.innerHTML = `
        <h2>Thank you for submitting your information!</h2>
        <p><strong>Fitness Goal:</strong> ${goal}</p>
        <p><strong>Desired Body Type:</strong> ${bodyType}</p>
        <p><strong>Desired Weight (lbs):</strong> ${weight}</p>
        <p><strong>Exercise Days per Week:</strong> ${exerciseDays}</p>
        <p><strong>Desired Age:</strong> ${age}</p>
        <p><strong>Gender:</strong> ${gender}</p>
        <p><strong>Current Fitness Level:</strong> ${fitnessLevel}</p>
    `;

    // Clear the form fields after submission
    document.getElementById('fitnessForm').reset();
});
