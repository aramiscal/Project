// Reliable Authentication UI Manager
// This script ensures proper display of UI elements after authentication

// Function to properly show authenticated UI elements
function showAuthenticatedUI() {
  console.log("Showing authenticated UI elements");

  // 1. Hide the auth container
  const authContainer = document.getElementById("auth-container");
  if (authContainer) {
    authContainer.style.display = "none";
    console.log("Auth container hidden");
  }

  // 2. Show the signed-in user container
  const signedInUser = document.getElementById("signed-in-user");
  if (signedInUser) {
    signedInUser.style.display = "flex"; // Use flex for better alignment
    console.log("Signed-in user info displayed");
  }

  // 3. Display username
  const username = localStorage.getItem("username");
  const usernameDisplay = document.getElementById("username-display");
  if (username && usernameDisplay) {
    usernameDisplay.textContent = username;
    console.log("Username displayed:", username);
  }

  // 4. Show all authenticated elements with proper display types

  // Tables need display:table
  const tableElements = document.querySelectorAll("table.auth-required");
  tableElements.forEach((element) => {
    element.style.display = "table";
    element.style.visibility = "visible";
    console.log("Auth-required table displayed");
  });

  // Boxes need display:block
  const boxElements = document.querySelectorAll(".box.auth-required");
  boxElements.forEach((element) => {
    element.style.display = "block";
    element.style.visibility = "visible";
    console.log("Auth-required box displayed");
  });

  // Other elements need display:block
  const otherElements = document.querySelectorAll(
    ".auth-required:not(table):not(.box)"
  );
  otherElements.forEach((element) => {
    element.style.display = "block";
    element.style.visibility = "visible";
    console.log("Other auth-required element displayed");
  });

  // 5. Load shopping list data
  setTimeout(() => {
    if (typeof getList === "function") {
      getList();
      console.log("Loading shopping list data");
    } else if (typeof window.getList === "function") {
      window.getList();
      console.log("Loading shopping list data via window object");
    }
  }, 100);
}

// Function to hide authenticated UI elements
function hideAuthenticatedUI() {
  console.log("Hiding authenticated UI elements");

  // 1. Show the auth container
  const authContainer = document.getElementById("auth-container");
  if (authContainer) {
    authContainer.style.display = "block";
    console.log("Auth container displayed");
  }

  // 2. Hide the signed-in user info
  const signedInUser = document.getElementById("signed-in-user");
  if (signedInUser) {
    signedInUser.style.display = "none";
    console.log("Signed-in user info hidden");
  }

  // 3. Hide all authenticated elements
  document.querySelectorAll(".auth-required").forEach((element) => {
    element.style.display = "none";
    console.log("Auth-required element hidden");
  });

  // 4. Reset shopping list
  const listRows = document.getElementById("list-rows");
  if (listRows) {
    listRows.innerHTML = "";
    console.log("Shopping list rows cleared");
  }

  // 5. Reset total price
  const totalPrice = document.getElementById("update-price");
  if (totalPrice) {
    totalPrice.textContent = "0";
    console.log("Total price reset");
  }
}

// Check authentication state and update UI accordingly
function checkAuthState() {
  const token = localStorage.getItem("access_token");
  if (token) {
    console.log("User is authenticated, showing authenticated UI");
    showAuthenticatedUI();
    return true;
  } else {
    console.log("User is not authenticated, showing auth UI");
    hideAuthenticatedUI();
    return false;
  }
}

// Enhanced sign-in handler that properly updates the UI
function enhancedSignIn(username, password) {
  console.log("Enhanced sign-in initiated for:", username);

  return new Promise((resolve, reject) => {
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
              // Store authentication data
              localStorage.setItem("access_token", response.access_token);
              localStorage.setItem("username", username);
              console.log("Authentication successful, updating UI");

              // Update UI
              showAuthenticatedUI();

              // Show success message
              if (typeof quickAlert === "function") {
                quickAlert(`Welcome back, ${username}!`, "success");
              }

              resolve(response);
            } else {
              reject({ detail: "Invalid response: no access token" });
            }
          } catch (e) {
            console.error("Error parsing sign-in response:", e);
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

// Enhanced sign-out function
function enhancedSignOut() {
  console.log("Enhanced sign-out initiated");

  // Clear authentication data
  localStorage.removeItem("access_token");
  localStorage.removeItem("username");

  // Update UI
  hideAuthenticatedUI();

  // Show success message
  if (typeof quickAlert === "function") {
    quickAlert("You have been signed out successfully", "info");
  }
}

// Initialize event listeners
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM loaded, initializing auth UI handlers");

  // Check initial auth state
  checkAuthState();

  // Set up sign-in form handler
  const signInForm = document.getElementById("sign-in-form");
  if (signInForm) {
    // Replace existing handlers with our enhanced one
    const newForm = signInForm.cloneNode(true);
    if (signInForm.parentNode) {
      signInForm.parentNode.replaceChild(newForm, signInForm);
    }

    newForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const username = document.getElementById("signin-username").value;
      const password = document.getElementById("signin-password").value;

      // Disable submit button
      const submitBtn = this.querySelector('button[type="submit"]');
      if (submitBtn) {
        const originalText = submitBtn.textContent;
        submitBtn.textContent = "Signing in...";
        submitBtn.disabled = true;
      }

      enhancedSignIn(username, password)
        .catch((error) => {
          console.error("Sign-in error:", error);
          if (typeof quickAlert === "function") {
            quickAlert(error.detail || "Sign-in failed", "danger");
          }
        })
        .finally(() => {
          // Re-enable submit button
          if (submitBtn) {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
          }
        });
    });

    console.log("Sign-in form handler set up");
  }

  // Set up sign-out button handler
  const signOutBtn = document.getElementById("sign-out-btn");
  if (signOutBtn) {
    // Replace existing handlers with our enhanced one
    const newBtn = signOutBtn.cloneNode(true);
    if (signOutBtn.parentNode) {
      signOutBtn.parentNode.replaceChild(newBtn, signOutBtn);
    }

    newBtn.addEventListener("click", function (e) {
      e.preventDefault();
      enhancedSignOut();
    });

    console.log("Sign-out button handler set up");
  }

  // Override existing functions
  window.checkAuthState = checkAuthState;
  window.showAuthenticatedUI = showAuthenticatedUI;
  window.hideAuthenticatedUI = hideAuthenticatedUI;
  window.enhancedSignIn = enhancedSignIn;
  window.enhancedSignOut = enhancedSignOut;

  // Also override existing functions if they exist
  if (typeof window.signIn === "function") {
    window.originalSignIn = window.signIn;
    window.signIn = enhancedSignIn;
  }

  if (typeof window.signOut === "function") {
    window.originalSignOut = window.signOut;
    window.signOut = enhancedSignOut;
  }

  if (typeof improvedSignOut === "function") {
    window.originalImprovedSignOut = window.improvedSignOut;
    window.improvedSignOut = enhancedSignOut;
  }

  // Check auth state periodically to ensure UI stays in sync
  setInterval(checkAuthState, 5000);
});
