
# **Fitness Bot**

## **Project Overview**

The Fitness Bot is an interactive web application that helps users generate personalized workout routines and diet plans based on their fitness goals and preferences. It also includes a progress tracking feature, allowing users to track their weight and workouts over time and visualize their progress through charts. The bot uses API integration to fetch tailored fitness and diet plans, along with providing additional resources such as workout videos and healthy recipe suggestions.

## **Key Features**

- **Personalized Fitness and Diet Plans:** Users can input their fitness goals, body type, and other parameters to receive customized workout routines and diet plans.
  
- **Progress Tracking:** Track your weight and workout completion weekly, with progress visualized through charts. Progress data is saved so users can return and continue tracking over time.

- **Interactive Chatbot:** Modify your fitness or diet plans dynamically by interacting with the chatbot. Simply type your preferences, and the chatbot updates your plan accordingly.

- **YouTube Video Resources:** Automatically fetches related workout videos and recipe suggestions based on your personalized plans.

- **Visual and Modern Design:** The app is designed with a clean, modern, and professional user interface, ensuring an easy-to-use experience.

## **How It Works**

1. **User Inputs**: 
   - The user logs in or registers an account.
   - Once logged in, the user fills out a fitness form specifying their fitness goal, desired body type, weight, exercise frequency, age, gender, and current fitness level.

2. **Plan Generation**:
   - The app generates a personalized workout and diet plan using the Groq API based on the user’s inputs.
   - Plans are saved to the user's profile for future access.

3. **Progress Tracking**:
   - Users can enter their current weight and workout frequency to track their progress over time. Progress is saved and visualized through dynamic charts.

4. **Additional Resources**:
   - Fetches related workout videos and diet-related recipe videos using the YouTube API, based on the user's saved plans.

## **Technologies Used**

- **HTML5**: Structure of the webpage
- **CSS3**: Styling and responsive layout
- **JavaScript (ES6+)**: Client-side logic, API integration, and dynamic DOM manipulation
- **Node.js & Express**: Backend server and API endpoints
- **MongoDB**: Database for storing user accounts, fitness data, and progress tracking
- **Groq API**: Generates personalized workout and diet plans
- **YouTube API**: Fetches relevant workout and diet-related videos
- **Chart.js**: Visualizes user progress with dynamic charts

## **How to Run the Project**

1. **Clone the Repository**:
   ```
   git clone https://github.com/whspieler/fitness_bot.git
   ```

2. **Install Dependencies**:
   - Navigate to the project folder and run:
   ```
   npm install
   ```

3. **Run the Server**:
   - Start the server by running:
   ```
   npm start
   ```

4. **Open in Browser**:
   - Open your browser and navigate to `http://localhost:8080` to interact with the Fitness Bot.

## **Future Improvements**

- Implement more detailed progress tracking with additional fitness metrics (e.g., muscle gain, fat percentage).
- Include more customization options in the fitness and diet plans.
- Add social features where users can share their progress with friends or join fitness communities.
- Enhance the chatbot with more natural language processing capabilities for a smoother user interaction.

## **Screenshots**
  1. User Log In Page: <br />
  <img width="400" alt="Screenshot 2024-09-30 at 12 48 44 PM" src="https://github.com/user-attachments/assets/86676425-f423-408a-af0a-90df4e1c5ffe">

  2. Fitness Form: <br />
  <img width="400" alt="Screenshot 2024-09-30 at 12 49 38 PM" src="https://github.com/user-attachments/assets/0dc06f6e-5bb5-495e-8808-78c2cc6a2094">

  3. Homepage: <br />
  <img width="400" alt="Screenshot 2024-09-30 at 12 50 12 PM" src="https://github.com/user-attachments/assets/42db7477-fe66-43ab-9b96-85ef6fb65e04">
  
  4. Fitness Plan: <br />
  <img width="400" alt="Screenshot 2024-09-30 at 12 51 59 PM" src="https://github.com/user-attachments/assets/eedaea31-418d-47d1-8cd8-8cc1e51632f6">

  5. Modify Fitness Plan with Chatbot: <br />
  
  <img width="400" alt="Screenshot 2024-09-30 at 12 53 17 PM" src="https://github.com/user-attachments/assets/bcfcfd2e-0027-4b5c-9ef4-70b779bc4009"> <br />
  
  <img width="400" alt="Screenshot 2024-09-30 at 12 54 05 PM" src="https://github.com/user-attachments/assets/98cea9ce-1437-4cc9-94ed-bb30b1a92e51">

  6. Diet Plan: <br />
  <img width="400" alt="Screenshot 2024-09-30 at 12 54 41 PM" src="https://github.com/user-attachments/assets/523afd05-44a7-4353-8c40-828d856ed197">

  7. Modify Diet Plan with Chatbot: <br />
  
  <img width="400" alt="Screenshot 2024-09-30 at 12 56 31 PM" src="https://github.com/user-attachments/assets/61387030-e9d9-4a11-8a56-a7ffb40d856b"><br />
  
  <img width="400" alt="Screenshot 2024-09-30 at 12 57 41 PM" src="https://github.com/user-attachments/assets/120520cb-3063-4269-a0a6-294701bdacc6">

  8. Track Your Progress: <br />
  
  <img width="400" alt="Screenshot 2024-09-30 at 12 58 07 PM" src="https://github.com/user-attachments/assets/a4662242-0e0f-4646-bca9-ca0772664a88"><br />
  
  <img width="400" alt="Screenshot 2024-09-30 at 12 58 58 PM" src="https://github.com/user-attachments/assets/49e1d56d-2c85-4f1c-abcd-569dfbc0ae10">

  9. YouTube Video Resources: <br />
  
  <img width="400" alt="Screenshot 2024-09-30 at 1 00 37 PM" src="https://github.com/user-attachments/assets/cf520f48-cfac-45e7-a058-5b0dac018d11"><br />
  
  <img width="400" alt="Screenshot 2024-09-30 at 1 02 42 PM" src="https://github.com/user-attachments/assets/a8fce522-bd2b-4a10-b528-76fbc3f73950">







