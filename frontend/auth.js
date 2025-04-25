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

// Update UI (Signin/Signup)
const updateUI = () => {
  const isAuthenticated = isLoggedIn();
  console.log("updateUI called, isAuthenticated:", isAuthenticated);

  // Always hide auth container when user is logged in
  const authContainer = document.getElementById("auth-container");
  if (authContainer) {
    authContainer.style.display = isAuthenticated ? "none" : "block";
    console.log("Auth container display set to:", authContainer.style.display);
  } else {
    console.error("Auth container element not found!");
  }

  // Show user info when logged in
  const signedInUser = document.getElementById("signed-in-user");
  if (signedInUser) {
    signedInUser.style.display = isAuthenticated ? "block" : "none";
  }

  if (isAuthenticated) {
    const usernameDisplay = document.getElementById("username-display");
    if (usernameDisplay) {
      usernameDisplay.textContent = getUsername();
    }
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
          console.log("Sign-in successful");
          const response = JSON.parse(xhr.responseText);
          storeToken(response.access_token);
          storeUserInfo(username); // Store username for display

          console.log("Token stored:", response.access_token);
          console.log("Username stored:", username);

          // Force hide auth container immediately after successful login
          const authContainer = document.getElementById("auth-container");
          if (authContainer) {
            console.log("Hiding auth container after successful login");
            authContainer.style.display = "none";
          } else {
            console.error("Auth container not found after successful login");
          }

          resolve(response);
        } else {
          console.log("Sign-in failed with status:", xhr.status);
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

const signOut = () => {
  removeToken();
  updateUI();
  // Reload page to clear user-specific data
  window.location.reload();
};

// Initialize auth state
const initAuth = () => {
  console.log("Initializing auth state");
  // First check if user is already logged in and update UI accordingly
  updateUI();

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

  // Sign Out button handler
  const signOutBtn = document.getElementById("sign-out-btn");
  if (signOutBtn) {
    signOutBtn.addEventListener("click", () => {
      console.log("Sign out button clicked");
      signOut();
      showAlert("You have been signed out.", "info");
    });
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

window.auth = {
  isLoggedIn,
  getToken,
  addAuthHeader,
  signOut,
  showAlert,
  getUsername,
};
