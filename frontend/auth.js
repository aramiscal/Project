// Store token in local storage
const storeToken = (token) => {
  localStorage.setItem("access_token", token);
};

// Remove token when logging out
const removeToken = () => {
  localStorage.removeItem("access_token");
};

const isLoggedIn = () => {
  return localStorage.getItem("access_token") != null;
};

const getToken = () => {
  return localStorage.getItem("access_token");
};

const addAuthHeader = (xhr) => {
  const token = getToken();
  if (token) {
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  }
};

// Update UI (Signin/Signup)
const updateUI = () => {
  const isAuthenticated = isLoggedIn();
  
  document.getElementById('auth-container').style.display = isAuthenticated ? 'none' : 'block';
  document.getElementById('signed-in-user').style.display = isAuthenticated ? 'block' : 'none';
  
  if (isAuthenticated) {
    // You might want to decode the JWT to get the username
    // This is a simplified approach
    document.getElementById('username-display').textContent = "Authenticated User";
  }
};

// Sign Up
const signUp = (username, email, password) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(
            xhr.status !== 0
              ? JSON.parse(xhr.responseText)
              : { detail: "Network error" }
          );
        }
      }
    };

    xhr.open("POST", "http://127.0.0.1:8000/users/signup", true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify({ username, email, password }));
  });
};

// Sign In
const signIn = (username, password) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          storeToken(response.access_token);
          resolve(response);
        } else {
          reject(
            xhr.status !== 0
              ? JSON.parse(xhr.responseText)
              : { detail: "Network error" }
          );
        }
      }
    };

    // The sign-in endpoint expects form data
    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    xhr.open("POST", "http://127.0.0.1:8000/users/sign-in", true);
    xhr.send(formData);
  });
};

const signOut = () => {
    removeToken();
    updateUI();
}

// Initialize auth state
const initAuth = () => {
  updateUI();
  
  // Set up event listeners for auth forms
  document.getElementById('sign-up-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    
    try {
      await signUp(username, email, password);
      // After successful signup, switch to the sign-in tab
      document.getElementById('signin-tab').click();
      document.getElementById('signin-username').value = username;
      document.getElementById('signin-password').value = '';
      
      showAlert('Sign-up successful! Please sign in.', 'success');
    } catch (error) {
      showAlert(error.detail || 'Sign-up failed. Please try again.', 'danger');
    }
  });
  
  document.getElementById('sign-in-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('signin-username').value;
    const password = document.getElementById('signin-password').value;
    
    try {
      await signIn(username, password);
      showAlert(`Welcome back, ${username}!`, 'success');
      updateUI();
    } catch (error) {
      showAlert(error.detail || 'Sign-in failed. Please check your credentials.', 'danger');
    }
  });
  
  document.getElementById('sign-out-btn').addEventListener('click', () => {
    signOut();
    showAlert('You have been signed out.', 'info');
  });
};

// Display alert messages
const showAlert = (message, type = 'info') => {
  const alertContainer = document.getElementById('alert-container');
  const alert = document.createElement('div');
  alert.className = `alert alert-${type} alert-dismissible fade show`;
  alert.role = 'alert';
  alert.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  alertContainer.appendChild(alert);
};