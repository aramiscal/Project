const api = "/list";

// Function to hide auth UI when sign-in is successful
function hideAuthUI() {
  // Get the auth container directly from the DOM
  const authContainer = document.querySelector(".auth-container");
  if (authContainer) {
    authContainer.style.display = "none";
  }

  // Show user content
  const authRequiredElements = document.querySelectorAll(".auth-required");
  authRequiredElements.forEach((el) => {
    el.style.display = "block";
  });

  // Show signed-in user info
  const signedInUser = document.getElementById("signed-in-user");
  if (signedInUser) {
    signedInUser.style.display = "block";
  }
}

// Function to show auth UI when user logs out
function showAuthUI() {
  // Get the auth container directly from the DOM
  const authContainer = document.getElementById("auth-container");
  if (authContainer) {
    authContainer.style.display = "block";
  }

  // Hide user content
  const authRequiredElements = document.querySelectorAll(".auth-required");
  authRequiredElements.forEach((el) => {
    el.style.display = "none";
  });

  // Hide signed-in user info
  const signedInUser = document.getElementById("signed-in-user");
  if (signedInUser) {
    signedInUser.style.display = "none";
  }
}

const addPrice = (list) => {
  let total_price = 0;
  const p = document.getElementById("update-price");
  for (let i = 0; i < list.length; i++) {
    total_price = total_price + list[i].price;
  }
  p.innerHTML = total_price;
};

const resetInput = () => {
  document.getElementById("new-name").value = "";
  document.getElementById("new-quantity").value = "";
  document.getElementById("new-type").value = "";
  document.getElementById("new-price").value = "";
};

document.getElementById("add-item").addEventListener("click", (e) => {
  e.preventDefault();
  postItem();
});

const postItem = () => {
  const nameInput = document.getElementById("new-name").value;
  const quantityInput = document.getElementById("new-quantity").value;
  const quantityToInt = parseInt(quantityInput, 10);
  const typeInput = document.getElementById("new-type").value;
  const priceInput = document.getElementById("new-price").value;
  const priceToInt = parseFloat(priceInput);

  // Check if all required fields are filled
  if (
    !nameInput ||
    !quantityInput ||
    typeInput === "Choose..." ||
    !priceInput
  ) {
    // Show alert if fields are not filled
    window.auth.showAlert("All fields are required", "danger");
    return;
  }

  const xhr = new XMLHttpRequest();
  xhr.onreadystatechange = () => {
    if (xhr.readyState == 4 && xhr.status == 201) {
      getList();
      resetInput();
    }
  };

  xhr.open("POST", api, true);
  xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  addAuthHeader(xhr);
  xhr.send(
    JSON.stringify({
      name: nameInput,
      type: typeInput,
      quantity: quantityToInt,
      price: priceToInt,
    })
  );
};

const deleteItem = (name) => {
  const xhr = new XMLHttpRequest();
  xhr.onreadystatechange = () => {
    if (xhr.readyState == 4 && xhr.status == 200) {
      getList();
    }
  };

  xhr.open("DELETE", `${api}/${name}`, true);
  addAuthHeader(xhr);
  xhr.send();
};

const displayList = (list) => {
  list.sort((a, b) => a.type.localeCompare(b.type));
  const tbody = document.getElementById("list-rows");
  tbody.innerHTML = "";
  const rows = list.map((x) => {
    return `<tr>
            <td>${x.name}</td>
            <td>${x.type}</td>
            <td>${x.quantity}</td>
            <td>$${x.price}</td>
            <td><button onClick="deleteItem('${x.name}')" type="button" class="btn btn-danger">Delete</button></td>
        </tr>`;
  });
  tbody.innerHTML = rows.join(" ");
};

const getList = () => {
  if (!window.auth.isLoggedIn()) {
    // Clear the list if not logged in
    document.getElementById("list-rows").innerHTML = "";
    document.getElementById("update-price").innerHTML = "0";
    return;
  }

  const xhr = new XMLHttpRequest();
  xhr.onreadystatechange = () => {
    if (xhr.readyState == 4) {
      if (xhr.status == 200) {
        data = JSON.parse(xhr.responseText);
        displayList(data);
        addPrice(data);
      } else if (xhr.status == 401) {
        // If unauthorized, show the auth UI
        showAuthUI();
        window.auth.showAlert(
          "Your session has expired. Please sign in again.",
          "warning"
        );
      }
    }
  };

  xhr.open("GET", api, true);
  addAuthHeader(xhr);
  xhr.send();
};

// Custom function for handling sign out
function handleSignOut() {
  console.log("Sign out function called");

  // Clear auth data from localStorage
  localStorage.removeItem("access_token");
  localStorage.removeItem("username");

  // Show the authentication UI
  showAuthUI();

  // Clear the shopping list
  document.getElementById("list-rows").innerHTML = "";

  // Reset total price
  document.getElementById("update-price").innerHTML = "0";

  // Show alert
  window.auth.showAlert("You have been signed out successfully.", "info");
}

// Attach the handleSignOut function to the window
window.handleSignOut = handleSignOut;

// Initialize the application
(() => {
  initAuth();

  // Check if the user is logged in
  if (window.auth.isLoggedIn()) {
    hideAuthUI();
    getList();
  } else {
    showAuthUI();
  }

  // Add event listener to the signout button
  const signOutBtn = document.getElementById("sign-out-btn");
  if (signOutBtn) {
    signOutBtn.addEventListener("click", handleSignOut);
  }
})();
