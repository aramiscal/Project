// Store token in local storage
const storeToken = (token) => {
  localStorage.setItem("access_token", token);
};

const storeUserInfo = (username) => {
  localStorage.setItem("username", username);
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
  document.getElementById("auth-container").style.display = isAuthenticated
    ? "none"
    : "block";
  document.getElementById("signed-in-user").style.display = isAuthenticated
    ? "block"
    : "none";

  if (isAuthenticated) {
    document.getElementById("username-display").textContent = getUsername();
  }

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
const signUp = (username, email, password) => {
  return new Promise((resolve, reject) => {
    // Validate Inputs
    if (!validatePassword(password)) {
      reject({ detail: "Password must be at least 8 characters long" });
      return;
    }

    if (!validateEmail(email)) {
      reject({ detail: "Please enter a valid email address" });
      return;
    }

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
    xhr.open("POST", "/users/signup", true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify({ username, email, password }));
  });
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

    xhr.open("POST", "/users/sign-in", true);
    xhr.send(formData);
  });
};

const signOut = () => {
  removeToken();
  updateUI();
  // REload page to clear user-specific data
  window.location.reload();
};

// Initialize auth state
const initAuth = () => {
  updateUI();

  document
    .getElementById("sign-up-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      const username = document.getElementById("signup-username").value;
      const email = document.getElementById("signup-email").value;
      const password = document.getElementById("signup-password").value;

      try {
        await signUp(username, email, password);
        // After successful signup, switch to the sign-in tab
        document.getElementById("signin-tab").click();
        document.getElementById("signin-username").value = username;
        document.getElementById("signin-password").value = "";

        showAlert("Sign-up successful! Please sign in.", "success");
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

      const username = document.getElementById("signin-username").value;
      const password = document.getElementById("signin-password").value;

      try {
        await signIn(username, password);
        showAlert(`Welcome back, ${username}!`, "success");
        updateUI();
        // Fetch user-specific data
        getList();
      } catch (error) {
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
  document.getElementById("sign-out-btn").addEventListener("click", () => {
    signOut();
    showAlert("You have been signed out.", "info");
  });
};

// Display alert messages
const showAlert = (message, type = "info") => {
  const alertContainer = document.getElementById("alert-container");
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
  showAlert
}