/**
 * Frontend Authentication Test Script
 *
 * This script allows you to test your frontend authentication system directly.
 * Save this file as frontend_test.js and include it in your HTML for testing.
 */

// Test functions for authentication
const authTest = {
  // Test user registration
  testSignUp: async function (username, email, password) {
    console.log(`Testing sign up with: ${username}, ${email}`);

    try {
      const response = await fetch("/users/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();
      console.log("Sign up response:", response.status, data);

      return {
        success: response.status === 201,
        status: response.status,
        data: data,
      };
    } catch (error) {
      console.error("Sign up error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Test user sign in
  testSignIn: async function (username, password) {
    console.log(`Testing sign in with username: ${username}`);

    try {
      // Create form data (the sign-in endpoint expects form data, not JSON)
      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);

      const response = await fetch("/users/sign-in", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log("Sign in response:", response.status, data);

      return {
        success: response.status === 200 && data.access_token,
        status: response.status,
        data: data,
      };
    } catch (error) {
      console.error("Sign in error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Test the entire auth flow (sign up then sign in)
  testAuthFlow: async function () {
    // Generate a unique test username
    const testUsername = `test_user_${new Date().getTime()}`;
    const testEmail = `${testUsername}@example.com`;
    const testPassword = "TestPassword123!";

    console.log("Starting authentication flow test...");
    console.log(`Test user: ${testUsername}, ${testEmail}`);

    // Step 1: Sign up
    const signUpResult = await this.testSignUp(
      testUsername,
      testEmail,
      testPassword
    );
    console.log("Sign up result:", signUpResult);

    if (!signUpResult.success) {
      console.error("Auth flow test failed at sign up stage");
      return {
        success: false,
        stage: "signup",
        error: signUpResult.data?.detail || "Unknown error",
      };
    }

    // Step 2: Sign in
    const signInResult = await this.testSignIn(testUsername, testPassword);
    console.log("Sign in result:", signInResult);

    if (!signInResult.success) {
      console.error("Auth flow test failed at sign in stage");
      return {
        success: false,
        stage: "signin",
        error: signInResult.data?.detail || "Unknown error",
      };
    }

    console.log("Auth flow test completed successfully!");
    return {
      success: true,
      username: testUsername,
      token: signInResult.data.access_token,
    };
  },

  // Add a simple UI for testing
  createTestUI: function () {
    // Create container
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.bottom = "20px";
    container.style.right = "20px";
    container.style.backgroundColor = "#fff";
    container.style.border = "1px solid #ccc";
    container.style.borderRadius = "5px";
    container.style.padding = "15px";
    container.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
    container.style.zIndex = "9999";
    container.style.maxWidth = "350px";

    // Add title
    const title = document.createElement("h3");
    title.textContent = "Auth System Test";
    title.style.margin = "0 0 10px 0";
    container.appendChild(title);

    // Add test button
    const button = document.createElement("button");
    button.textContent = "Run Auth Flow Test";
    button.style.backgroundColor = "#4CAF50";
    button.style.color = "white";
    button.style.border = "none";
    button.style.padding = "8px 12px";
    button.style.borderRadius = "4px";
    button.style.cursor = "pointer";
    button.style.marginRight = "10px";
    container.appendChild(button);

    // Add close button
    const closeButton = document.createElement("button");
    closeButton.textContent = "Close";
    closeButton.style.backgroundColor = "#f44336";
    closeButton.style.color = "white";
    closeButton.style.border = "none";
    closeButton.style.padding = "8px 12px";
    closeButton.style.borderRadius = "4px";
    closeButton.style.cursor = "pointer";
    container.appendChild(closeButton);

    // Add result area
    const resultArea = document.createElement("div");
    resultArea.style.marginTop = "10px";
    resultArea.style.padding = "10px";
    resultArea.style.backgroundColor = "#f5f5f5";
    resultArea.style.borderRadius = "4px";
    resultArea.style.maxHeight = "300px";
    resultArea.style.overflow = "auto";
    resultArea.style.display = "none";
    container.appendChild(resultArea);

    // Add to document
    document.body.appendChild(container);

    // Event listeners
    button.addEventListener("click", async () => {
      button.disabled = true;
      button.textContent = "Testing...";
      resultArea.style.display = "block";
      resultArea.innerHTML = "<p>Running authentication flow test...</p>";

      try {
        const result = await this.testAuthFlow();

        if (result.success) {
          resultArea.innerHTML = `
              <p style="color: green; font-weight: bold;">✅ Authentication flow successful!</p>
              <p>Username: ${result.username}</p>
              <p>Token: ${result.token.substring(0, 10)}...</p>
            `;
        } else {
          resultArea.innerHTML = `
              <p style="color: red; font-weight: bold;">❌ Test failed at ${result.stage} stage</p>
              <p>Error: ${result.error}</p>
            `;
        }
      } catch (error) {
        resultArea.innerHTML = `
            <p style="color: red; font-weight: bold;">❌ Test error</p>
            <p>${error.message}</p>
          `;
      } finally {
        button.disabled = false;
        button.textContent = "Run Auth Flow Test";
      }
    });

    closeButton.addEventListener("click", () => {
      container.remove();
    });

    return container;
  },

  // Initialize testing UI
  init: function () {
    this.createTestUI();
    console.log(
      "Auth test module initialized. Use authTest.testAuthFlow() to run a complete test."
    );
  },
};

// Auto-initialize when included in a page
if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => {
    authTest.init();
  });
}

// Make available globally
if (typeof window !== "undefined") {
  window.authTest = authTest;
}
