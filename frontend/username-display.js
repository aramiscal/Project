// Function to ensure the username is displayed
function ensureUsernameDisplay() {
    // Get username from localStorage
    const username = localStorage.getItem('username');
    
    // Get the username display element
    const usernameDisplay = document.getElementById('username-display');
    
    if (username && usernameDisplay) {
      // Set the username text
      usernameDisplay.textContent = username;
      
      // Make sure the signed-in user container is visible
      const signedInUser = document.getElementById('signed-in-user');
      if (signedInUser) {
        signedInUser.style.display = 'block';
      }
      
      console.log('Username display updated:', username);
    } else {
      console.log('Username display not updated:', 
                  username ? 'Username found' : 'Username not found',
                  usernameDisplay ? 'Display element found' : 'Display element not found');
    }
  }
  
  // Check on page load
  document.addEventListener('DOMContentLoaded', function() {
    console.log('Checking username display on page load');
    
    // Check if user is logged in
    const token = localStorage.getItem('access_token');
    if (token) {
      console.log('User is logged in, ensuring username is displayed');
      ensureUsernameDisplay();
    } else {
      console.log('User is not logged in');
    }
  });
  
  // Check periodically (every 2 seconds)
  setInterval(function() {
    const token = localStorage.getItem('access_token');
    if (token) {
      ensureUsernameDisplay();
    }
  }, 2000);
  
  // Add a global function that can be called from other scripts
  window.updateUsername = ensureUsernameDisplay;
  
  // Also check after any potential login activity
  document.addEventListener('click', function(e) {
    // If the clicked element is a submit button in a form
    if (e.target.tagName === 'BUTTON' && 
        e.target.type === 'submit' && 
        e.target.closest('form')) {
      
      // Wait a short time and then check
      setTimeout(function() {
        const token = localStorage.getItem('access_token');
        if (token) {
          ensureUsernameDisplay();
        }
      }, 1000);
    }
  });