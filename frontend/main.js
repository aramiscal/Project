/**
 * Shopping List Application - Main functionality
 */

const api = "/list";

// Calculate and update total price
const updateTotalPrice = (list) => {
  let totalPrice = 0;
  const priceElement = document.getElementById("update-price");

  if (!priceElement) return;

  if (!list || !Array.isArray(list)) {
    priceElement.textContent = "0";
    return;
  }

  for (const item of list) {
    if (item && typeof item.price === "number") {
      totalPrice += item.price;
    }
  }

  priceElement.textContent = totalPrice.toFixed(2);
};

// Reset input fields
const resetInputFields = () => {
  const nameInput = document.getElementById("new-name");
  const quantityInput = document.getElementById("new-quantity");
  const typeInput = document.getElementById("new-type");
  const priceInput = document.getElementById("new-price");

  if (nameInput) nameInput.value = "";
  if (quantityInput) quantityInput.value = "";
  if (typeInput) typeInput.value = "Choose...";
  if (priceInput) priceInput.value = "";
};

// Fetch shopping list from server
const getList = () => {
  // Check if auth module is loaded
  if (typeof window.auth === "undefined") return;

  // Check if user is logged in
  if (!window.auth.isLoggedIn()) {
    window.auth.hideAuthenticatedUI();
    return;
  }

  const xhr = new XMLHttpRequest();
  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        try {
          const list = JSON.parse(xhr.responseText);
          displayList(list);
        } catch (e) {
          window.auth.quickAlert("Error loading your shopping list", "danger");
        }
      } else if (xhr.status === 401) {
        window.auth.quickAlert(
          "Your session has expired. Please sign in again.",
          "warning"
        );
        window.auth.hideAuthenticatedUI();
      }
    }
  };

  xhr.open("GET", api, true);
  window.auth.addAuthHeader(xhr);
  xhr.send();
};

// Add a new item
const addItem = () => {
  // Check if auth module is loaded
  if (typeof window.auth === "undefined") return;

  // Check if user is logged in
  if (!window.auth.isLoggedIn()) {
    window.auth.quickAlert(
      "Please sign in to add items to your list",
      "warning"
    );
    window.auth.hideAuthenticatedUI();
    return;
  }

  const nameInput = document.getElementById("new-name");
  const quantityInput = document.getElementById("new-quantity");
  const typeInput = document.getElementById("new-type");
  const priceInput = document.getElementById("new-price");

  if (!nameInput || !quantityInput || !typeInput || !priceInput) return;

  const name = nameInput.value.trim();
  const quantity = quantityInput.value.trim();
  const type = typeInput.value;
  const price = priceInput.value.trim();

  // Validate inputs
  if (!name || !quantity || type === "Choose..." || !price) {
    window.auth.quickAlert("All fields are required", "danger");
    return;
  }

  const quantityValue = parseInt(quantity, 10);
  const priceValue = parseFloat(price);

  if (isNaN(quantityValue) || quantityValue <= 0) {
    window.auth.quickAlert("Quantity must be a positive number", "danger");
    return;
  }

  if (isNaN(priceValue) || priceValue <= 0) {
    window.auth.quickAlert("Price must be a positive number", "danger");
    return;
  }

  const xhr = new XMLHttpRequest();
  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4) {
      if (xhr.status === 201) {
        getList();
        resetInputFields();
        window.auth.quickAlert("Item added to your personal list!", "success");
      } else if (xhr.status === 401) {
        window.auth.quickAlert(
          "Your session has expired. Please sign in again.",
          "warning"
        );
        window.auth.hideAuthenticatedUI();
      } else {
        window.auth.quickAlert("Error adding item", "danger");
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
      quantity: quantityValue,
      price: priceValue,
    })
  );
};

// Delete an item
const deleteItem = (name) => {
  if (typeof window.auth === "undefined") return;

  if (!window.auth.isLoggedIn()) {
    window.auth.quickAlert("Please sign in to manage your list", "warning");
    window.auth.hideAuthenticatedUI();
    return;
  }

  const xhr = new XMLHttpRequest();
  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        getList();
        window.auth.quickAlert(
          "Item deleted from your personal list!",
          "success"
        );
      } else if (xhr.status === 401) {
        window.auth.quickAlert(
          "Your session has expired. Please sign in again.",
          "warning"
        );
        window.auth.hideAuthenticatedUI();
      } else if (xhr.status === 404) {
        window.auth.quickAlert(
          "This item wasn't found in your personal list.",
          "warning"
        );
        getList();
      }
    }
  };

  xhr.open("DELETE", `${api}/${name}`, true);
  window.auth.addAuthHeader(xhr);
  xhr.send();
};

// Display shopping list
const displayList = (list) => {
  if (!list || !Array.isArray(list)) return;

  // Sort by type (aisle)
  list.sort((a, b) => (a.type || "").localeCompare(b.type || ""));

  const tbody = document.getElementById("list-rows");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center">No items in your personal shopping list</td></tr>`;
    updateTotalPrice([]);
    return;
  }

  const rows = list.map((item) => {
    if (!item || typeof item !== "object") return "";

    return `<tr>
            <td>${item.name || ""}</td>
            <td>${item.type || ""}</td>
            <td>${item.quantity || 0}</td>
            <td>${
              typeof item.price === "number" ? item.price.toFixed(2) : "0.00"
            }</td>
            <td><button onclick="deleteItem('${
              item.name || ""
            }')" type="button" class="btn btn-danger">Delete</button></td>
        </tr>`;
  });

  tbody.innerHTML = rows.join("");
  updateTotalPrice(list);
};

// Initialize application
document.addEventListener("DOMContentLoaded", () => {
  const addItemBtn = document.getElementById("add-item");
  if (addItemBtn) {
    addItemBtn.addEventListener("click", addItem);
  }

  // Check if the user is logged in
  if (typeof window.auth !== "undefined" && window.auth.isLoggedIn()) {
    window.auth.showAuthenticatedUI();
    getList();
  }
});

// Expose functions globally
window.getList = getList;
window.deleteItem = deleteItem;
