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

// Fixed add auth header function - properly format the Authorization header
const addAuthHeader = (xhr) => {
  const token = getToken();
  if (token) {
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    console.log("Added auth header: Bearer " + token.substring(0, 10) + "...");
  } else {
    console.warn("No token available for auth header");
  }
};

// Improved function to ensure username is displayed next to "Welcome"
function enhanceUsernameDisplay() {
  console.log("Enhancing username display");

  // Get username from localStorage
  const username = localStorage.getItem("username");

  // Get the username display element
  const usernameDisplay = document.getElementById("username-display");

  if (username && usernameDisplay) {
    // Set the username text
    usernameDisplay.textContent = username;
    console.log("Username display updated to:", username);

    // Make sure the signed-in user container is visible
    const signedInUser = document.getElementById("signed-in-user");
    if (signedInUser) {
      signedInUser.style.display = "flex"; // Using flex for proper alignment
      console.log("Signed-in user info container made visible");
    }
  } else {
    console.warn(
      "Username not displayed:",
      username ? "Username found in storage" : "Username not found in storage",
      usernameDisplay ? "Display element found" : "Display element not found"
    );
  }
}

// Call this function after successful sign-in
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM loaded, checking for username display");

  // Check if user is logged in
  const token = localStorage.getItem("access_token");
  if (token) {
    console.log("User appears to be logged in, showing username");
    enhanceUsernameDisplay();

    // Also override the existing updateUsernameDisplay function if it exists
    if (typeof window.updateUsernameDisplay === "function") {
      console.log("Overriding existing updateUsernameDisplay function");
      window.updateUsernameDisplay = enhanceUsernameDisplay;
    }
  }

  // Add this function to the sign-in process
  const signInForm = document.getElementById("sign-in-form");
  if (signInForm) {
    signInForm.addEventListener("submit", function () {
      // Check after a slight delay to allow the login to complete
      setTimeout(enhanceUsernameDisplay, 1000);
    });
  }

  // Make sure any direct sign-in button also triggers username display
  const signInButton = document.querySelector('#signin button[type="submit"]');
  if (signInButton) {
    signInButton.addEventListener("click", function () {
      // Check after a slight delay to allow the login to complete
      setTimeout(enhanceUsernameDisplay, 1000);
    });
  }

  // Also set an interval to check periodically
  setInterval(enhanceUsernameDisplay, 2000);
});

// Make the function available globally
window.enhanceUsernameDisplay = enhanceUsernameDisplay;

// Update UI (Signin/Signup)
const updateUI = () => {
  const isAuthenticated = isLoggedIn();
  console.log("Updating UI based on authentication status:", isAuthenticated);

  // Get auth container and check if it exists
  const authContainer = document.getElementById("auth-container");
  if (authContainer) {
    authContainer.style.display = isAuthenticated ? "none" : "block";
    console.log("Auth container display set to:", authContainer.style.display);
  }

  // Show user info when logged in
  const signedInUser = document.getElementById("signed-in-user");
  if (signedInUser) {
    signedInUser.style.display = isAuthenticated ? "block" : "none";
    console.log("Signed in user display set to:", signedInUser.style.display);
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
  const confirmPassword = document.getElementById(
    "signup-confirm-password"
  ).value;

  // Check if passwords match
  if (password !== confirmPassword) {
    if (typeof window.quickAlert === "function") {
      window.quickAlert("Passwords do not match", "danger");
    } else {
      showAlert("Passwords do not match", "danger");
    }
    return;
  }

  // Check if password is valid
  if (!validatePassword(password)) {
    if (typeof window.quickAlert === "function") {
      window.quickAlert(
        "Password must be at least 8 characters long",
        "danger"
      );
    } else {
      showAlert("Password must be at least 8 characters long", "danger");
    }
    return;
  }

  // Check if email is valid
  if (!validateEmail(email)) {
    if (typeof window.quickAlert === "function") {
      window.quickAlert("Please enter a valid email address", "danger");
    } else {
      showAlert("Please enter a valid email address", "danger");
    }
    return;
  }

  // Show loading indicator
  const submitBtn = document.querySelector('#signup button[type="submit"]');
  const originalText = submitBtn ? submitBtn.textContent : "Sign Up";
  if (submitBtn) {
    submitBtn.textContent = "Signing up...";
    submitBtn.disabled = true;
  }

  // Hide the auth container when Sign Up is clicked
  const authContainer = document.getElementById("auth-container");
  if (authContainer) {
    authContainer.style.display = "none";
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
        // Log the response for debugging
        console.log("Sign-up successful! Server response:", xhr.responseText);

        // Show the sign-in tab with a success message
        showAlert(
          "Sign-up successful! Your account has been created in MongoDB. Please sign in.",
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
          console.error("Sign-up error:", response);
        } catch (e) {
          showAlert(
            "Sign-up failed. Could not save to MongoDB. Please try again.",
            "danger"
          );
          console.error(
            "Sign-up error parsing response:",
            e,
            "Status:",
            xhr.status,
            "Response:",
            xhr.responseText
          );
        }

        if (authContainer) {
          authContainer.style.display = "block";
        }
      }
    }
  };

  // Create user object to be stored in MongoDB
  const userData = {
    username: username,
    email: email,
    password: password,
  };

  // Send the request to the backend API endpoint that handles MongoDB insertion
  xhr.open("POST", "/users/signup", true);
  xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhr.send(JSON.stringify(userData));
  console.log(
    "Sign up request sent for user:",
    username,
    "Data will be stored in MongoDB 'users' collection"
  );
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
        console.log("Sign-in response received, status:", xhr.status);
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            console.log(
              "Token received:",
              response.access_token
                ? "Yes (length: " + response.access_token.length + ")"
                : "No"
            );

            if (!response.access_token) {
              reject({
                detail: "Invalid response from server - no token received",
              });
              return;
            }

            storeToken(response.access_token);
            storeUserInfo(username); // Store username for display

            // Hide auth container immediately after successful login
            const authContainer = document.getElementById("auth-container");
            if (authContainer) {
              authContainer.style.display = "none";
            }

            // Update username display
            updateUsernameDisplay();

            // Show shopping list UI elements
            showShoppingListUI();

            resolve(response);
          } catch (e) {
            console.error("Error parsing response:", e);
            reject({ detail: "Error processing server response" });
          }
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
    console.log("Sign-in request sent for user:", username);
  });
};

// Enhanced Sign Out function
function improvedSignOut() {
  console.log("Sign out initiated");

  // Clear authentication data from localStorage
  localStorage.removeItem("access_token");
  localStorage.removeItem("username");

  // Show the authentication UI
  const authContainer = document.getElementById("auth-container");
  if (authContainer) {
    authContainer.style.display = "block";
    authContainer.style.visibility = "visible";
    console.log("Auth container shown");
  } else {
    console.error("Auth container not found!");
  }

  // Hide the signed-in user display
  const signedInUser = document.getElementById("signed-in-user");
  if (signedInUser) {
    signedInUser.style.display = "none";
    console.log("Signed-in user info hidden");
  }

  // Clear the shopping list in the UI
  const listRows = document.getElementById("list-rows");
  if (listRows) {
    listRows.innerHTML = "";
    console.log("Shopping list cleared");
  }

  // Reset the total price
  const totalPrice = document.getElementById("update-price");
  if (totalPrice) {
    totalPrice.textContent = "0";
    console.log("Total price reset");
  }

  // Hide all elements that require authentication
  const tableElements = document.querySelectorAll("table.auth-required");
  tableElements.forEach((element) => {
    element.style.display = "none";
    console.log("Table element hidden");
  });

  const boxElements = document.querySelectorAll(".box.auth-required");
  boxElements.forEach((element) => {
    element.style.display = "none";
    console.log("Box element hidden");
  });

  const otherAuthElements = document.querySelectorAll(
    ".auth-required:not(table):not(.box)"
  );
  otherAuthElements.forEach((element) => {
    element.style.display = "none";
    console.log("Other auth element hidden");
  });

  // Reset input fields
  const nameInput = document.getElementById("new-name");
  const quantityInput = document.getElementById("new-quantity");
  const typeInput = document.getElementById("new-type");
  const priceInput = document.getElementById("new-price");

  if (nameInput) nameInput.value = "";
  if (quantityInput) quantityInput.value = "";
  if (typeInput) typeInput.value = "Choose...";
  if (priceInput) priceInput.value = "";
  console.log("Input fields reset");

  // Show a success message
  const alertContainer = document.getElementById("alert-container");
  if (alertContainer) {
    const alert = document.createElement("div");
    alert.className = "alert alert-info alert-dismissible fade show";
    alert.role = "alert";
    alert.innerHTML = `
      You have been signed out successfully.
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    alertContainer.appendChild(alert);
    console.log("Sign-out success message shown");
  }
}

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
        signUp();
      } catch (error) {
        showAlert(
          error.detail || "Sign-up failed. Please try again.",
          "danger"
        );
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

        // Make sure all shopping list elements are visible
        showShoppingListUI();

        // Update any other UI elements
        updateUI();
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
  showAlert("You have been signed out successfully.", "info");
}

// Direct approach to change UI after sign-in
function forceShowShoppingUI() {
  console.log("FORCING UI CHANGE: Showing shopping list UI");

  // Hide auth container with !important
  const authContainer = document.getElementById("auth-container");
  if (authContainer) {
    authContainer.style.display = "none";
    authContainer.style.visibility = "hidden"; // Add extra hiding
    console.log("Auth container forcibly hidden");
  }

  // Show all shopping list elements with appropriate display
  const boxElements = document.querySelectorAll(".box.auth-required");
  boxElements.forEach((el) => {
    el.style.display = "block";
    el.style.visibility = "visible";
    console.log("Shopping list box displayed");
  });

  // Tables need display:table
  const tableElements = document.querySelectorAll("table.auth-required");
  tableElements.forEach((el) => {
    el.style.display = "table";
    el.style.visibility = "visible";
    console.log("Shopping list table displayed");
  });

  // Other elements need display:block
  const otherElements = document.querySelectorAll(
    ".auth-required:not(table):not(.box)"
  );
  otherElements.forEach((el) => {
    el.style.display = "block";
    el.style.visibility = "visible";
    console.log("Other shopping list elements displayed");
  });

  // Show user info and ensure username is displayed
  const signedInUser = document.getElementById("signed-in-user");
  if (signedInUser) {
    signedInUser.style.display = "flex"; // Using flex for alignment
    signedInUser.style.visibility = "visible";
    console.log("User info displayed");

    // Make sure username is displayed
    if (typeof window.enhanceUsernameDisplay === "function") {
      window.enhanceUsernameDisplay();
    } else {
      // Fallback if enhanced function isn't available
      const username = localStorage.getItem("username");
      const usernameDisplay = document.getElementById("username-display");
      if (username && usernameDisplay) {
        usernameDisplay.textContent = username;
        console.log("Username display updated to:", username);
      }
    }
  }

  // Try to load shopping list data
  setTimeout(function () {
    if (typeof window.getList === "function") {
      window.getList();
      console.log("Attempting to load shopping list data");
    } else if (typeof getList === "function") {
      getList();
      console.log("Attempting to load shopping list data");
    } else {
      console.warn("getList function not available");
    }
  }, 500);
}

// Direct override of the sign-in form submission
document.addEventListener("DOMContentLoaded", function () {
  console.log("Setting up direct form submission handler");

  const signInForm = document.getElementById("sign-in-form");
  if (signInForm) {
    // Replace existing handlers with our direct one
    signInForm.addEventListener(
      "submit",
      function (e) {
        e.preventDefault();

        const username = document.getElementById("signin-username").value;
        const password = document.getElementById("signin-password").value;

        console.log("Direct sign-in handler: Attempting login for", username);

        // Use FormData for the request
        const formData = new FormData();
        formData.append("username", username);
        formData.append("password", password);

        // Create and send request
        const xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
          if (xhr.readyState === 4) {
            if (xhr.status === 200) {
              try {
                const response = JSON.parse(xhr.responseText);

                // Store authentication data
                localStorage.setItem("access_token", response.access_token);
                localStorage.setItem("username", username);

                console.log("Login successful! Forcing UI change");

                // Make sure the username is displayed
                if (typeof window.enhanceUsernameDisplay === "function") {
                  window.enhanceUsernameDisplay();
                } else {
                  // Fallback if enhanced function isn't available
                  const usernameDisplay =
                    document.getElementById("username-display");
                  if (usernameDisplay) {
                    usernameDisplay.textContent = username;
                  }

                  // Make sure the user info container is shown
                  const signedInUser =
                    document.getElementById("signed-in-user");
                  if (signedInUser) {
                    signedInUser.style.display = "flex";
                  }
                }

                // Add a small delay to ensure DOM updates
                setTimeout(forceShowShoppingUI, 100);

                // Show success message
                const alertContainer =
                  document.getElementById("alert-container");
                if (alertContainer) {
                  const alert = document.createElement("div");
                  alert.className =
                    "alert alert-success alert-dismissible fade show";
                  alert.innerHTML = `Welcome back, ${username}! <button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
                  alertContainer.appendChild(alert);
                }
              } catch (e) {
                console.error("Error processing login response:", e);
                alert("Error logging in. Please try again.");
              }
            } else {
              console.error("Login failed with status:", xhr.status);
              alert("Login failed. Please check your credentials.");
            }
          }
        };

        xhr.open("POST", "/users/sign-in", true);
        xhr.send(formData);
      },
      true
    ); // Use capture to ensure our handler runs first

    console.log("Direct form submission handler installed");
  } else {
    console.error("Could not find sign-in form!");
  }

  // Check if already logged in
  if (localStorage.getItem("access_token")) {
    console.log("User already logged in, forcing UI update");
    setTimeout(forceShowShoppingUI, 100);
  }
});

// Expose the function globally
window.forceShowShoppingUI = forceShowShoppingUI;

// Expose functions to window object
window.auth = {
  isLoggedIn,
  getToken,
  addAuthHeader,
  signOut,
  showAlert,
  getUsername,
  updateUI,
  handleSignOut,
};
