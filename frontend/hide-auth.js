// This function will hide the auth UI
function hideAuthContainer() {
  // Get the auth container by ID (preferred method)
  const authContainer = document.getElementById("auth-container");
  if (authContainer) {
    console.log("Found auth container by ID");
    authContainer.style.display = "none";

    // Enable auth-required elements
    document.querySelectorAll(".auth-required").forEach((el) => {
      el.style.display = "block";
    });

    // Show signed-in user info
    const signedInUser = document.getElementById("signed-in-user");
    if (signedInUser) {
      signedInUser.style.display = "block";
    }

    console.log("Auth UI hidden");
    return;
  }

  // If we couldn't find it by ID, try alternative selectors
  const selectors = [
    ".auth-container", // By class
    "div:has(.nav-tabs#auth-tab)", // By content
    "h5 > div", // By structure (from your HTML)
    "h5 div", // Alternative structure
  ];

  // Try each selector until we find something
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      console.log(
        `Found ${elements.length} elements with selector: ${selector}`
      );
      elements.forEach((el) => {
        console.log("Hiding element:", el);
        el.style.display = "none";
      });

      // Enable auth-required elements
      document.querySelectorAll(".auth-required").forEach((el) => {
        el.style.display = "block";
      });

      // Show signed-in user info
      const signedInUser = document.getElementById("signed-in-user");
      if (signedInUser) {
        signedInUser.style.display = "block";
      }

      console.log("Auth UI hiding complete");
      return;
    }
  }

  console.warn("Could not find auth container with any selector");
}

// This function will show the auth UI
function showAuthContainer() {
  // Get the auth container by ID (preferred method)
  const authContainer = document.getElementById("auth-container");
  if (authContainer) {
    console.log("Found auth container by ID");
    authContainer.style.display = "block";

    // Disable auth-required elements
    document.querySelectorAll(".auth-required").forEach((el) => {
      el.style.display = "none";
    });

    // Hide signed-in user info
    const signedInUser = document.getElementById("signed-in-user");
    if (signedInUser) {
      signedInUser.style.display = "none";
    }

    console.log("Auth UI shown");
    return;
  }

  // If we couldn't find it by ID, try alternative selectors
  const selectors = [
    ".auth-container", // By class
    "div:has(.nav-tabs#auth-tab)", // By content
    "h5 > div", // By structure (from your HTML)
    "h5 div", // Alternative structure
  ];

  // Try each selector until we find something
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      console.log(
        `Found ${elements.length} elements with selector: ${selector}`
      );
      elements.forEach((el) => {
        console.log("Showing element:", el);
        el.style.display = "block";
      });

      // Disable auth-required elements
      document.querySelectorAll(".auth-required").forEach((el) => {
        el.style.display = "none";
      });

      // Hide signed-in user info
      const signedInUser = document.getElementById("signed-in-user");
      if (signedInUser) {
        signedInUser.style.display = "none";
      }

      console.log("Auth UI showing complete");
      return;
    }
  }

  console.warn("Could not find auth container with any selector");
}

// Function to override the existing sign-in function
function patchSignIn() {
  // Check if the original sign-in function exists
  if (typeof window.signIn === "function") {
    console.log("Patching signIn function");
    // Store the original function
    const originalSignIn = window.signIn;

    // Replace with our patched version
    window.signIn = function (username, password) {
      console.log("Patched signIn called");
      return originalSignIn(username, password).then((response) => {
        console.log("Sign-in successful, hiding auth UI");
        hideAuthContainer();
        return response;
      });
    };
  } else {
    console.warn("signIn function not found, cannot patch");
  }
}

// Function to override the existing sign-out function
function patchSignOut() {
  // Check if the original sign-out function exists
  if (
    typeof window.auth !== "undefined" &&
    typeof window.auth.signOut === "function"
  ) {
    console.log("Patching signOut function");
    // Store the original function
    const originalSignOut = window.auth.signOut;

    // Replace with our patched version
    window.auth.signOut = function () {
      console.log("Patched signOut called");
      originalSignOut();

      // Ensure the auth container is shown
      console.log("Ensuring auth UI is shown");
      showAuthContainer();
    };
  } else {
    console.warn("signOut function not found, cannot patch");
  }
}

// Patch the sign-in form submission
function patchSignInForm() {
  const form = document.getElementById("sign-in-form");
  if (form) {
    console.log("Patching sign-in form");
    // Remove existing listeners (doesn't work for anonymous functions but worth trying)
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    // Add our listener
    newForm.addEventListener("submit", function (e) {
      e.preventDefault();
      console.log("Sign-in form submitted (patched handler)");

      const username = document.getElementById("signin-username").value;
      const password = document.getElementById("signin-password").value;

      // If signIn is a global function
      if (typeof window.signIn === "function") {
        window
          .signIn(username, password)
          .then(() => {
            console.log("Sign-in successful via patched form handler");
            hideAuthContainer();
          })
          .catch((error) => {
            console.error("Sign-in failed:", error);
          });
      } else {
        // Try to submit the form using vanilla auth approach
        const formData = new FormData();
        formData.append("username", username);
        formData.append("password", password);

        fetch("/users/sign-in", {
          method: "POST",
          body: formData,
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.access_token) {
              localStorage.setItem("access_token", data.access_token);
              localStorage.setItem("username", username);
              console.log("Sign-in successful via fetch");
              hideAuthContainer();
            }
          })
          .catch((error) => {
            console.error("Sign-in failed:", error);
          });
      }
    });
  }
}

// Patch the sign-out button
function patchSignOutButton() {
  const button = document.getElementById("sign-out-btn");
  if (button) {
    console.log("Patching sign-out button");

    // Remove existing listeners
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);

    // Add our listener
    newButton.addEventListener("click", function () {
      console.log("Sign-out button clicked (patched handler)");

      // Clear localStorage
      localStorage.removeItem("access_token");
      localStorage.removeItem("username");

      // Show auth UI
      showAuthContainer();

      // Clear the shopping list
      const listRows = document.getElementById("list-rows");
      if (listRows) {
        listRows.innerHTML = "";
      }

      // Reset total price
      const totalPrice = document.getElementById("update-price");
      if (totalPrice) {
        totalPrice.textContent = "0";
      }

      // Show alert
      if (
        typeof window.auth !== "undefined" &&
        typeof window.auth.showAlert === "function"
      ) {
        window.auth.showAlert("You have been signed out successfully.", "info");
      } else {
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
        }
      }
    });
  }
}

// Check if user is logged in and hide auth UI if they are
function checkAuthState() {
  const token = localStorage.getItem("access_token");
  if (token) {
    console.log("User is already logged in, hiding auth UI");
    hideAuthContainer();
  } else {
    console.log("User is not logged in, showing auth UI");
    showAuthContainer();
  }
}

// Initialize everything
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM loaded, initializing auth UI handler");

  // Call this first in case user is already logged in
  checkAuthState();

  // Then patch the sign-in functionality
  patchSignIn();
  patchSignInForm();

  // Patch the sign-out functionality
  patchSignOut();
  patchSignOutButton();

  // Direct  way to handle the sign in button click
  document
    .querySelectorAll('#sign-in-form button[type="submit"]')
    .forEach((button) => {
      button.addEventListener("click", function () {
        console.log("Sign in button clicked directly");
        // Wait a moment and check auth status again
        setTimeout(checkAuthState, 1000);
      });
    });
});

// Add extra handler for successful API calls
(function () {
  // Patch XMLHttpRequest to detect successful sign-in
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (
    method,
    url,
    async,
    user,
    password
  ) {
    // Store the URL to check later
    this._url = url;
    return originalOpen.apply(this, arguments);
  };

  const originalSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (body) {
    const xhr = this;

    // Add response handler
    const originalOnReadyStateChange = xhr.onreadystatechange;
    xhr.onreadystatechange = function () {
      // Call original handler if it exists
      if (originalOnReadyStateChange) {
        originalOnReadyStateChange.apply(this, arguments);
      }

      // Check if this is a completed sign-in request
      if (xhr.readyState === 4 && xhr._url && xhr._url.includes("/sign-in")) {
        console.log("Sign-in request completed with status:", xhr.status);
        if (xhr.status === 200) {
          console.log("Sign-in successful, hiding auth UI");
          setTimeout(hideAuthContainer, 100);
        }
      }
    };

    return originalSend.apply(this, arguments);
  };
})();

// Expose functions globally so they can be called from anywhere
window.hideAuthUI = hideAuthContainer;
window.showAuthUI = showAuthContainer;
