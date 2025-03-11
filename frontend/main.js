const api = "http://127.0.0.1:8000/list";

let total_price = 0;

const addPrice = (list) => {
  const p = document.getElementById("total-price");
  for(let i = 0; i < list.length; i++) {
    total_price = total_price + list[i].price;
  }
  p.innerHTML += total_price;
}

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
            <td></td>
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
