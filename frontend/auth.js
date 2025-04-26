/**
 * Consolidated Authentication Module
 * Combines functionality from auth.js, auth-fix.js, and hide-auth.js
 */

// ----- Auth State Management ----- //

// Store token in local storage
const storeToken = (token) => {
  localStorage.setItem("access_token", token);
};

// Store user info
const storeUserInfo = (username) => {
  localStorage.setItem("username", username);
};

// Get username from storage
const getUsername = () => {
  return localStorage.getItem("username");
};

// Remove token and user info when logging out
const removeToken = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("username");
};

// Check if the user is logged in
const isLoggedIn = () => {
  return localStorage.getItem("access_token") != null;
};

// Get stored token
const getToken = () => {
  return localStorage.getItem("access_token");
};

// Add auth header to XHR requests
const addAuthHeader = (xhr) => {
  const token = getToken();
  if (token) {
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  }
};

// ----- UI Management ----- //

// Show authenticated UI elements
function showAuthenticatedUI() {
  // Hide the auth container
  const authContainer = document.getElementById("auth-container");
  if (authContainer) {
    authContainer.style.display = "none";
  }

  // Show the signed-in user container
  const signedInUser = document.getElementById("signed-in-user");
  if (signedInUser) {
    signedInUser.style.display = "flex";
  }

  // Display username
  updateUsernameDisplay();

  // Show table elements
  const tableElements = document.querySelectorAll("table.auth-required");
  tableElements.forEach((element) => {
    element.style.display = "table";
    element.style.visibility = "visible";
  });

  // Show box elements
  const boxElements = document.querySelectorAll(".box.auth-required");
  boxElements.forEach((element) => {
    element.style.display = "block";
    element.style.visibility = "visible";
  });

  // Show other elements
  const otherElements = document.querySelectorAll(
    ".auth-required:not(table):not(.box)"
  );
  otherElements.forEach((element) => {
    element.style.display = "block";
    element.style.visibility = "visible";
  });

  // Add authenticated class to body
  document.body.classList.add("authenticated");

  // Load shopping list data
  setTimeout(() => {
    if (typeof getList === "function") {
      getList();
    }
  }, 100);
}

// Hide authenticated UI elements
function hideAuthenticatedUI() {
  // Show the auth container
  const authContainer = document.getElementById("auth-container");
  if (authContainer) {
    authContainer.style.display = "block";
  }

  // Hide the signed-in user info
  const signedInUser = document.getElementById("signed-in-user");
  if (signedInUser) {
    signedInUser.style.display = "none";
  }

  // Hide all authenticated elements
  document.querySelectorAll(".auth-required").forEach((element) => {
    element.style.display = "none";
  });

  // Reset shopping list
  const listRows = document.getElementById("list-rows");
  if (listRows) {
    listRows.innerHTML = "";
  }

  // Reset total price
  const totalPrice = document.getElementById("update-price");
  if (totalPrice) {
    totalPrice.textContent = "0";
  }

  // Remove authenticated class from body
  document.body.classList.remove("authenticated");
}

// Check authentication state and update UI
function checkAuthState() {
  const token = localStorage.getItem("access_token");
  if (token) {
    showAuthenticatedUI();
    return true;
  } else {
    hideAuthenticatedUI();
    return false;
  }
}

// Update the username display
function updateUsernameDisplay() {
  const username = localStorage.getItem("username");
  const usernameDisplay = document.getElementById("username-display");

  if (username && usernameDisplay) {
    usernameDisplay.textContent = username;
    const signedInUser = document.getElementById("signed-in-user");
    if (signedInUser) {
      signedInUser.style.display = "flex";
    }
  }
}

// ----- Authentication Operations ----- //

// Sign In
function signIn(username, password) {
  return new Promise((resolve, reject) => {
    if (!username || !password) {
      reject({ detail: "Username and password are required" });
      return;
    }

    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);

            if (response.access_token) {
              storeToken(response.access_token);
              storeUserInfo(username);
              showAuthenticatedUI();
              quickAlert(`Welcome back, ${username}!`, "success");
              resolve(response);
            } else {
              reject({ detail: "Invalid response: no access token" });
            }
          } catch (e) {
            reject({ detail: "Error processing server response" });
          }
        } else {
          let errorMessage = "Sign-in failed";
          try {
            if (xhr.responseText) {
              const errorResponse = JSON.parse(xhr.responseText);
              errorMessage = errorResponse.detail || errorMessage;
            }
          } catch (e) {
            errorMessage = "Error during sign-in";
          }
          reject({ detail: errorMessage });
        }
      }
    };

    xhr.open("POST", "/users/sign-in", true);
    xhr.send(formData);
  });
}

// Sign Up
function signUp() {
  const username = document.getElementById("signup-username").value;
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  const confirmPassword = document.getElementById(
    "signup-confirm-password"
  ).value;

  // Validate inputs
  if (password !== confirmPassword) {
    quickAlert("Passwords do not match", "danger");
    return;
  }

  if (password.length < 8) {
    quickAlert("Password must be at least 8 characters long", "danger");
    return;
  }

  if (!validateEmail(email)) {
    quickAlert("Please enter a valid email address", "danger");
    return;
  }

  // Show loading indicator
  const submitBtn = document.querySelector('#signup button[type="submit"]');
  const originalText = submitBtn ? submitBtn.textContent : "Sign Up";
  if (submitBtn) {
    submitBtn.textContent = "Signing up...";
    submitBtn.disabled = true;
  }

  const xhr = new XMLHttpRequest();
  xhr.onreadystatechange = () => {
    if (xhr.readyState == 4) {
      // Reset button state
      if (submitBtn) {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }

      if (xhr.status == 201) {
        // Show the sign-in tab with a success message
        quickAlert(
          "Sign-up successful! Your account has been created. Please sign in.",
          "success"
        );

        const signinTab = document.getElementById("signin-tab");
        if (signinTab) {
          signinTab.click();
        }

        const signinUsername = document.getElementById("signin-username");
        if (signinUsername) {
          signinUsername.value = username;
        }

        const signinPassword = document.getElementById("signin-password");
        if (signinPassword) {
          signinPassword.value = "";
        }
      } else {
        // Show error message
        try {
          const response = JSON.parse(xhr.responseText);
          quickAlert(response.detail || "Sign-up failed", "danger");
        } catch (e) {
          quickAlert(
            "Sign-up failed. Could not save to MongoDB. Please try again.",
            "danger"
          );
        }
      }
    }
  };

  // Create user object
  const userData = {
    username: username,
    email: email,
    password: password,
  };

  // Send the request
  xhr.open("POST", "/users/signup", true);
  xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhr.send(JSON.stringify(userData));
}

// Sign Out
function signOut() {
  removeToken();
  hideAuthenticatedUI();
  quickAlert("You have been signed out successfully", "info");
}

// ----- Helper Functions ----- //

// Form validation for email
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Show alerts
function quickAlert(message, type = "info") {
  const alertContainer = document.getElementById("alert-container");
  if (!alertContainer) {
    return;
  }

  const alert = document.createElement("div");
  alert.className = `alert alert-${type} alert-dismissible fade show`;
  alert.role = "alert";
  alert.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;

  alertContainer.appendChild(alert);

  // Auto-dismiss after 2 seconds
  setTimeout(() => {
    alert.classList.remove("show");
    setTimeout(() => {
      try {
        alertContainer.removeChild(alert);
      } catch (e) {
        // Alert might have been removed already
      }
    }, 300);
  }, 2000);
}

// ----- Initialize Auth ----- //

function initAuth() {
  // Check if user is already logged in
  checkAuthState();
  updateUsernameDisplay();

  // Set up sign-up form handler
  const signUpForm = document.getElementById("sign-up-form");
  if (signUpForm) {
    signUpForm.addEventListener("submit", (e) => {
      e.preventDefault();
      signUp();
    });
  }

  // Set up sign-in form handler
  const signInForm = document.getElementById("sign-in-form");
  if (signInForm) {
    signInForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const username = document.getElementById("signin-username").value;
      const password = document.getElementById("signin-password").value;

      // Get submit button for loading state
      const submitBtn = e.target.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = "Signing in...";
      submitBtn.disabled = true;

      try {
        await signIn(username, password);
      } catch (error) {
        quickAlert(error.detail || "Sign-in failed", "danger");
      } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  // Set up sign-out button
  const signOutBtn = document.getElementById("sign-out-btn");
  if (signOutBtn) {
    signOutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      signOut();
    });
  }

  // Check auth state periodically
  setInterval(checkAuthState, 5000);
}

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", initAuth);

// ----- Exports ----- //

// Expose functions to window object
window.auth = {
  isLoggedIn,
  getToken,
  addAuthHeader,
  signIn,
  signUp,
  signOut,
  getUsername,
  checkAuthState,
  showAuthenticatedUI,
  hideAuthenticatedUI,
  updateUsernameDisplay,
  quickAlert,
};

// For backward compatibility
window.signIn = signIn;
window.signUp = signUp;
window.signOut = signOut;
window.checkAuthState = checkAuthState;
window.showAuthenticatedUI = showAuthenticatedUI;
window.hideAuthenticatedUI = hideAuthenticatedUI;
window.updateUsernameDisplay = updateUsernameDisplay;
window.quickAlert = quickAlert;
window.enhanceUsernameDisplay = updateUsernameDisplay;
window.improvedSignOut = signOut;
window.forceShowShoppingUI = showAuthenticatedUI;
