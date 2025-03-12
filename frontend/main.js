const api = "http://127.0.0.1:8000/list";

const addPrice = (list) => {
  let total_price = 0;
  const p = document.getElementById("update-price");
  for(let i = 0; i < list.length; i++) {
    total_price = total_price + list[i].price;
  }
  p.innerHTML = total_price;
}

const resetInput = () => {
  document.getElementById('new-name').value = '';
  document.getElementById('new-quantity').value = '';
  document.getElementById('new-type').value = '';
  document.getElementById('new-price').value = '';
}

document.getElementById('add-item').addEventListener('click', (e) => {
  e.preventDefault();
  postItem();
})

const postItem = () => {
  const nameInput = document.getElementById('new-name').value;
  const quantityInput = document.getElementById('new-quantity').value;
  const quantityToInt = parseInt(quantityInput, 10);
  const typeInput = document.getElementById('new-type').value;
  const priceInput = document.getElementById('new-price').value;
  const priceToInt = parseInt(priceInput, 10);

  const xhr = new XMLHttpRequest();
  xhr.onreadystatechange = () => {
    if (xhr.readyState == 4 && xhr.status == 201) {
      getList();
      resetInput();
    }
  };

  xhr.open('POST', api, true);
  xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  xhr.send(JSON.stringify({ 
    name: nameInput, 
    type: typeInput, 
    quantity: quantityToInt, 
    price: priceToInt 
  }));
}

const deleteItem = (name) => {
  const xhr = new XMLHttpRequest();
  xhr.onreadystatechange = () => {
    if (xhr.readyState == 4 && xhr.status == 200) {
      getList();
    }
  };

  xhr.open('DELETE', `${api}/${name}`, true);
  xhr.send();
};

const displayList = (list) => {
  list.sort((a,b) => a.type.localeCompare(b.type));
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
  const xhr = new XMLHttpRequest();
  xhr.onreadystatechange = () => {
    if (xhr.readyState == 4 && xhr.status == 200) {
      data = JSON.parse(xhr.responseText);
      displayList(data);
      addPrice(data);
    }
  };

  xhr.open("GET", api, true);
  xhr.send();
};

(() => {
  getList();
})();
