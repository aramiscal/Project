// This function will hide the auth UI
function hideAuthContainer() {
  // Try multiple selectors to find the auth container
  const selectors = [
    "#auth-container", // By ID (if you added the ID)
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
    }
  }

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

// Check if user is logged in and hide auth UI if they are
function checkAuthState() {
  const token = localStorage.getItem("access_token");
  if (token) {
    console.log("User is already logged in, hiding auth UI");
    hideAuthContainer();
  } else {
    console.log("User is not logged in, showing auth UI");
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

  // Direct way to handle the sign in button click
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

// Expose the function globally so it can be called from console for debugging
window.hideAuthUI = hideAuthContainer;
