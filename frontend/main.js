const api = "http://127.0.0.1:8000";

const displayList = (list) => {
  const tbody = document.getElementById("list-rows");
  tbody.innerHTML = "";
  const rows = list.map((x) => {
    return `<tr>
            <td>${x.id}</td>
            <td>${x.name}</td>
            <td>${x.quantity}</td>
        </tr>`;
  });
  tbody.innerHTML = rows.join(" ");
};

const getList = () => {
  const xhr = new XMLHttpRequest();
  xhr.onreadystatechange = () => {
    if (xhr.readyState == 4 && xhr.status == 200) {
      data = JSON.parse(xhr.responseText);
      console.log(data);
      displayList(data);
    }
  };

  xhr.open("GET", api, true);
  xhr.send();
};

(() => {
  getList();
})();
