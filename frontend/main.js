const api = "/list";

// Check if auth module is loaded and ready
function checkAuthReady() {
  if (typeof window.auth === "undefined") {
    console.error("Auth module not loaded!");
    return false;
  }
  return true;
}

// Function to hide auth UI when sign-in is successful
function hideAuthUI() {
  // Get the auth container directly from the DOM
  const authContainer = document.querySelector("#auth-container");
  if (authContainer) {
    console.log("Found auth container by ID, hiding");
    authContainer.style.display = "none";
  } else {
    console.warn("Auth container not found by ID");
  }

  // Show user content
  const authRequiredElements = document.querySelectorAll(".auth-required");
  authRequiredElements.forEach((el) => {
    el.style.display = el.tagName === "TABLE" ? "table" : "block";
  });

  // Show signed-in user info
  const signedInUser = document.getElementById("signed-in-user");
  if (signedInUser) {
    signedInUser.style.display = "block";
  }
}

// Function to show auth UI when user logs out
function showAuthUI() {
  console.log("Showing auth UI");

  // Get the auth container directly from the DOM
  const authContainer = document.getElementById("auth-container");
  if (authContainer) {
    console.log("Found auth container, showing");
    authContainer.style.display = "block";
  } else {
    console.warn("Auth container not found!");

    // Try alternative selectors
    const altContainer = document.querySelector(".auth-container");
    if (altContainer) {
      console.log("Found auth container by class, showing");
      altContainer.style.display = "block";
    } else {
      console.error("Auth container not found by any selector!");
    }
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
  if (!p) {
    console.warn("Price element not found");
    return;
  }

  if (!list || !Array.isArray(list)) {
    console.warn("List is not valid", list);
    p.innerHTML = "0";
    return;
  }

  for (let i = 0; i < list.length; i++) {
    if (list[i] && typeof list[i].price === "number") {
      total_price = total_price + list[i].price;
    }
  }
  p.innerHTML = total_price.toFixed(2);
};

const resetInput = () => {
  const nameInput = document.getElementById("new-name");
  const quantityInput = document.getElementById("new-quantity");
  const typeInput = document.getElementById("new-type");
  const priceInput = document.getElementById("new-price");

  if (nameInput) nameInput.value = "";
  if (quantityInput) quantityInput.value = "";
  if (typeInput) typeInput.value = "Choose...";
  if (priceInput) priceInput.value = "";
};

document.addEventListener("DOMContentLoaded", function () {
  const addItemBtn = document.getElementById("add-item");
  if (addItemBtn) {
    addItemBtn.addEventListener("click", (e) => {
      e.preventDefault();
      postItem();
    });
  } else {
    console.warn("Add item button not found");
  }

  // Check if the user is logged in
  if (checkAuthReady() && window.auth.isLoggedIn()) {
    console.log("User is logged in, initializing UI");
    hideAuthUI();
    getList();
  } else {
    console.log("User is not logged in, showing auth UI");
    showAuthUI();
  }

  // Initialize auth if needed
  if (typeof window.initAuth === "function") {
    window.initAuth();
  }
});

const postItem = () => {
  if (!checkAuthReady()) return;

  const nameInput = document.getElementById("new-name");
  const quantityInput = document.getElementById("new-quantity");
  const typeInput = document.getElementById("new-type");
  const priceInput = document.getElementById("new-price");

  if (!nameInput || !quantityInput || !typeInput || !priceInput) {
    console.error("One or more input elements not found");
    return;
  }

  const name = nameInput.value.trim();
  const quantity = quantityInput.value.trim();
  const type = typeInput.value;
  const price = priceInput.value.trim();

  // Check if all required fields are filled
  if (!name || !quantity || type === "Choose..." || !price) {
    // Show alert if fields are not filled
    window.auth.showAlert("All fields are required", "danger");
    return;
  }

  const quantityToInt = parseInt(quantity, 10);
  const priceToFloat = parseFloat(price);

  // Validate numeric values
  if (isNaN(quantityToInt) || quantityToInt <= 0) {
    window.auth.showAlert("Quantity must be a positive number", "danger");
    return;
  }

  if (isNaN(priceToFloat) || priceToFloat <= 0) {
    window.auth.showAlert("Price must be a positive number", "danger");
    return;
  }

  const xhr = new XMLHttpRequest();
  xhr.onreadystatechange = () => {
    if (xhr.readyState == 4) {
      if (xhr.status == 201) {
        getList();
        resetInput();
        window.auth.showAlert("Item added successfully!", "success");
      } else if (xhr.status == 401) {
        console.error("Unauthorized when adding item");
        window.auth.showAlert(
          "Your session has expired. Please sign in again.",
          "warning"
        );
        showAuthUI();
      } else {
        console.error("Error adding item", xhr.status, xhr.responseText);
        window.auth.showAlert(
          "Error adding item: " +
            (xhr.status === 0 ? "Network error" : xhr.status),
          "danger"
        );
      }
    }
  };

  xhr.open("POST", api, true);
  xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  window.auth.addAuthHeader(xhr);
  xhr.send(
    JSON.stringify({
      name: name,
      type: type,
      quantity: quantityToInt,
      price: priceToFloat,
    })
  );
};

const deleteItem = (name) => {
  if (!checkAuthReady()) return;

  const xhr = new XMLHttpRequest();
  xhr.onreadystatechange = () => {
    if (xhr.readyState == 4) {
      if (xhr.status == 200) {
        getList();
        window.auth.showAlert("Item deleted successfully!", "success");
      } else if (xhr.status == 401) {
        console.error("Unauthorized when deleting item");
        window.auth.showAlert(
          "Your session has expired. Please sign in again.",
          "warning"
        );
        showAuthUI();
      } else {
        console.error("Error deleting item", xhr.status, xhr.responseText);
        window.auth.showAlert(
          "Error deleting item: " +
            (xhr.status === 0 ? "Network error" : xhr.status),
          "danger"
        );
      }
    }
  };

  xhr.open("DELETE", `${api}/${name}`, true);
  window.auth.addAuthHeader(xhr);
  xhr.send();
};

const displayList = (list) => {
  if (!list || !Array.isArray(list)) {
    console.warn("Invalid list data", list);
    return;
  }

  // Sort by type (aisle)
  list.sort((a, b) => (a.type || "").localeCompare(b.type || ""));

  const tbody = document.getElementById("list-rows");
  if (!tbody) {
    console.error("List rows element not found");
    return;
  }

  tbody.innerHTML = "";

  if (list.length === 0) {
    // If the list is empty, show a message
    tbody.innerHTML = `<tr><td colspan="5" class="text-center">No items in your shopping list</td></tr>`;
    updateTotalPrice([]);
    return;
  }

  const rows = list.map((x) => {
    if (!x || typeof x !== "object") {
      console.warn("Invalid list item", x);
      return "";
    }

    return `<tr>
            <td>${x.name || ""}</td>
            <td>${x.type || ""}</td>
            <td>${x.quantity || 0}</td>
            <td>${
              typeof x.price === "number" ? x.price.toFixed(2) : "0.00"
            }</td>
            <td><button onClick="deleteItem('${
              x.name || ""
            }')" type="button" class="btn btn-danger">Delete</button></td>
        </tr>`;
  });

  tbody.innerHTML = rows.join("");

  // Update total price
  addPrice(list);
};
