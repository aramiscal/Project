// Store token in local storage
const storeToken = (token) => {
  localStorage.setItem("access_token", token);
};

const storeUserInfo = (username) => {
  localStorage.setItem("username", username);
};

const getUsername = () => {
  return localStorage.getItem("username");
};

// Remove token when logging out
const removeToken = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("username");
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

// Function to ensure username is displayed
function updateUsernameDisplay() {
  const username = getUsername();
  const usernameDisplay = document.getElementById("username-display");

  if (username && usernameDisplay) {
    usernameDisplay.textContent = username;

    // Make sure the user info container is visible
    const signedInUser = document.getElementById("signed-in-user");
    if (signedInUser) {
      signedInUser.style.display = "block";
    }
  }
}

// Update UI (Signin/Signup)
const updateUI = () => {
  const isAuthenticated = isLoggedIn();

  // Get auth container and check if it exists
  const authContainer = document.getElementById("auth-container");
  if (authContainer) {
    authContainer.style.display = isAuthenticated ? "none" : "block";
  }

  // Show user info when logged in
  const signedInUser = document.getElementById("signed-in-user");
  if (signedInUser) {
    signedInUser.style.display = isAuthenticated ? "block" : "none";
  }

  if (isAuthenticated) {
    updateUsernameDisplay();
  }

  // Show content that requires authentication
  const mainContentElements = document.querySelectorAll(".auth-required");
  mainContentElements.forEach((element) => {
    element.style.display = isAuthenticated ? "block" : "none";
  });
};

// Form control: Password must be greater than 8 characters
const validatePassword = (password) => {
  return password.length >= 8;
};

// Form control: email must be valid
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Sign Up
const signUp = () => {
  const username = document.getElementById("signup-username").value;
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;

  // Hide the auth container when Sign Up is clicked
  const authContainer = document.getElementById("auth-container");
  if (authContainer) {
    authContainer.style.display = "none";
  }

  const xhr = new XMLHttpRequest();
  xhr.onreadystatechange = () => {
    if (xhr.readyState == 4) {
      if (xhr.status == 201) {
        getList();
        // Show the sign-in tab with a success message
        showAlert("Sign-up successful! Please sign in.", "success");

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

        // Show the auth container again
        setTimeout(() => {
          if (authContainer) {
            authContainer.style.display = "block";
          }
        }, 500);
      } else {
        // Show error message and make the auth container visible again
        try {
          const response = JSON.parse(xhr.responseText);
          showAlert(response.detail || "Sign-up failed", "danger");
        } catch (e) {
          showAlert("Sign-up failed. Please try again.", "danger");
        }

        if (authContainer) {
          authContainer.style.display = "block";
        }
      }
    }
  };

  xhr.open("POST", "/users/signup", true);
  xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhr.send(JSON.stringify({ username, email, password }));
};

// Sign In
const signIn = (username, password) => {
  return new Promise((resolve, reject) => {
    // Username and Password are required
    if (!username || !password) {
      reject({ detail: "Username and password are required" });
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          storeToken(response.access_token);
          storeUserInfo(username); // Store username for display

          // Hide auth container immediately after successful login
          const authContainer = document.getElementById("auth-container");
          if (authContainer) {
            authContainer.style.display = "none";
          }

          // Update username display
          updateUsernameDisplay();

          resolve(response);
        } else {
          let errorMessage = "Network error";
          try {
            if (xhr.responseText) {
              const errorResponse = JSON.parse(xhr.responseText);
              errorMessage = errorResponse.detail || "Sign-in failed";
            }
          } catch (e) {
            errorMessage = "Something went wrong during sign-in";
          }
          reject({ detail: errorMessage });
        }
      }
    };

    // The sign-in endpoint expects form data
    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    xhr.open("POST", "/users/sign-in", true);
    xhr.send(formData);
  });
};

// Enhanced Sign Out functionality
const signOut = () => {
  console.log("Sign out initiated");

  // Clear authentication data
  removeToken();

  // Show the authentication UI
  const authContainer = document.getElementById("auth-container");
  if (authContainer) {
    authContainer.style.display = "block";
  }

  // Hide the signed-in user display
  const signedInUser = document.getElementById("signed-in-user");
  if (signedInUser) {
    signedInUser.style.display = "none";
  }

  // Clear the shopping list in the UI
  const listRows = document.getElementById("list-rows");
  if (listRows) {
    listRows.innerHTML = "";
  }

  // Reset the total price
  const totalPrice = document.getElementById("update-price");
  if (totalPrice) {
    totalPrice.textContent = "0";
  }

  // Hide all elements that require authentication
  const authRequiredElements = document.querySelectorAll(".auth-required");
  authRequiredElements.forEach((element) => {
    element.style.display = "none";
  });

  // Reset input fields
  const nameInput = document.getElementById("new-name");
  const quantityInput = document.getElementById("new-quantity");
  const typeInput = document.getElementById("new-type");
  const priceInput = document.getElementById("new-price");

  if (nameInput) nameInput.value = "";
  if (quantityInput) quantityInput.value = "";
  if (typeInput) typeInput.value = "";
  if (priceInput) priceInput.value = "";

  // Show a success message
  showAlert("You have been signed out successfully.", "info");
};

// Initialize auth state
const initAuth = () => {
  console.log("Initializing auth state");
  // First check if user is already logged in and update UI accordingly
  updateUI();
  updateUsernameDisplay(); // Ensure username is displayed on page load

  document
    .getElementById("sign-up-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      const username = document.getElementById("signup-username").value;
      const email = document.getElementById("signup-email").value;
      const password = document.getElementById("signup-password").value;
      const confirmPassword = document.getElementById(
        "signup-confirm-password"
      ).value;

      if (password !== confirmPassword) {
        showAlert("Passwords do not match", "danger");
        return;
      }

      // Get the submit button to show loading state
      const submitBtn = e.target.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = "Signing up...";
      submitBtn.disabled = true;

      try {
        // Hide the auth container when Sign Up button is clicked
        const authContainer = document.getElementById("auth-container");
        if (authContainer) {
          authContainer.style.display = "none";
        }

        signUp(username, email, password);
      } catch (error) {
        showAlert(
          error.detail || "Sign-up failed. Please try again.",
          "danger"
        );
        // Show the auth container again if there's an error
        const authContainer = document.getElementById("auth-container");
        if (authContainer) {
          authContainer.style.display = "block";
        }
      } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });

  document
    .getElementById("sign-in-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      console.log("Sign-in form submitted");

      const username = document.getElementById("signin-username").value;
      const password = document.getElementById("signin-password").value;

      // Get the submit button to show loading state
      const submitBtn = e.target.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = "Signing in...";
      submitBtn.disabled = true;

      try {
        console.log("Attempting to sign in with username:", username);
        await signIn(username, password);
        console.log("Sign-in successful, updating UI");
        showAlert(`Welcome back, ${username}!`, "success");

        // Explicitly hide the auth container again
        const authContainer = document.getElementById("auth-container");
        if (authContainer) {
          console.log("Explicitly hiding auth container after sign-in");
          authContainer.style.display = "none";
        }

        // Update the rest of the UI
        updateUI();

        // Fetch user-specific data
        getList();
      } catch (error) {
        console.error("Sign-in error:", error);
        showAlert(
          error.detail || "Sign-in failed. Please check your credentials.",
          "danger"
        );
      } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });

  // Connect sign-out button with proper error handling
  const signOutBtn = document.getElementById("sign-out-btn");
  if (signOutBtn) {
    signOutBtn.addEventListener("click", () => {
      console.log("Sign out button clicked");
      try {
        signOut();
      } catch (error) {
        console.error("Error during sign out:", error);
        showAlert(
          "There was a problem signing out. Please try again.",
          "danger"
        );
      }
    });
  } else {
    console.warn("Sign out button not found in the DOM");
  }
};

// Display alert messages
const showAlert = (message, type = "info") => {
  const alertContainer = document.getElementById("alert-container");
  if (!alertContainer) {
    console.error("Alert container not found!");
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
};

// Direct sign-out function - simplified for reliability
function handleSignOut() {
  console.log("Sign out function called");

  // Clear auth data from localStorage
  localStorage.removeItem("access_token");
  localStorage.removeItem("username");

  // Reset UI state
  document.getElementById("auth-container").style.display = "block";
  document.getElementById("signed-in-user").style.display = "none";

  // Clear the shopping list
  document.getElementById("list-rows").innerHTML = "";

  // Reset total price
  document.getElementById("update-price").innerHTML = "0";

  // Hide authenticated elements
  document.querySelectorAll(".auth-required").forEach((el) => {
    el.style.display = "none";
  });

  // Show alert
  const alertContainer = document.getElementById("alert-container");
  const alert = document.createElement("div");
  alert.className = "alert alert-info alert-dismissible fade show";
  alert.role = "alert";
  alert.innerHTML = `
    You have been signed out successfully.
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  alertContainer.appendChild(alert);
}

window.auth = {
  isLoggedIn,
  getToken,
  addAuthHeader,
  signOut,
  showAlert,
  getUsername,
};
