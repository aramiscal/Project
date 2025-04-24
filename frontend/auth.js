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

