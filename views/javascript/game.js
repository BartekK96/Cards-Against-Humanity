const socket = io({ transports: ["websocket"], upgrade: false });

const blackCard = document.getElementById("blackCard");
const allWhiteCards = document.getElementById("allWhiteCards");
const allYourCards = document.getElementById("allYourCards");
const users = document.getElementById("users");

let newTurn = true;
let master;

socket.on("sendSetup", data => {
  let markup = "";
  for (let i = 0; i < data.res.length; i++) {
    markup += `<li class="active user">${data.res[i].login}: ${data.res[i].points}/${data.winPoints}</li>`;
  }
  socket.emit("gameStarted", { id });
  users.insertAdjacentHTML("afterbegin", markup);
});

socket.on("newWhiteCardsDeal", data => {
  let markup = "";
  for (let i = 0; i < data.length; i++) {
    markup += `<div class="col-sm card border border-dark m-2">${data[i]}</div>`;
  }
  allYourCards.insertAdjacentHTML("afterbegin", markup);
});

if (newTurn) {
  newTurn = false;
  socket.emit("newTurn", true);
  socket.on("newBlackCard", data => {
    let markup = ``;
    markup += `<div class="card-body">
                  <p class="card-text">
                  ${data.data.description}
                  </p>
                </div>`;
    blackCard.insertAdjacentHTML("afterbegin", markup);
    master = data.master;
    // removing active
    const users = document.querySelectorAll(".user");
    [].forEach.call(users, function(el) {
      el.classList.remove("active");
      if (el.innerHTML.split(":")[0] === `${master}`) {
        el.setAttribute("class", "active");
      }
    });
  });
}


