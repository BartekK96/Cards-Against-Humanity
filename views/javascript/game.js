const socket = io({ transports: ["websocket"], upgrade: false });

const blackCard = document.getElementById("blackCard");
const allYourCards = document.getElementById("allYourCards");
const commonBoard = document.getElementById("allWhiteCards");
const users = document.getElementById("users");

// this are states variables
let newTurn = true;
let master;
let added = true;
let masterId;
let isMaster;

socket.on("sendSetup", data => {
  let markup = "";
  for (let i = 0; i < data.res.length; i++) {
    markup += `<li class="active user list-group-item">${data.res[i].login}: ${data.res[i].points}/${data.winPoints}</li>`;
  }
  socket.emit("gameStarted", { id });
  users.insertAdjacentHTML("afterbegin", markup);
});

socket.on("newWhiteCardsDeal", data => {
  while (allYourCards.firstChild) {
    allYourCards.removeChild(allYourCards.firstChild);
  }
  let markup = "";
  for (let i = 0; i < data.length; i++) {
    markup += `<div class="col-sm card border border-dark m-2 your_card">${data[i]}</div>`;
  }
  allYourCards.insertAdjacentHTML("afterbegin", markup);
});

if (newTurn) {
  newTurn = false;

  socket.emit("newTurn", true);
  socket.on("newBlackCard", data => {
    added = false;
    while (blackCard.firstChild) {
      blackCard.removeChild(blackCard.firstChild);
    }
    let markup = ``;
    markup += `<div class="card-body">
                  <p class="card-text">
                  ${data.data.description}
                  </p>
                </div>`;
    blackCard.insertAdjacentHTML("afterbegin", markup);
    master = data.master.login;
    masterId = data.master.id;
    // removing active
    const users = document.querySelectorAll(".user");
    [].forEach.call(users, function(el) {
      el.classList.remove("active");
      if (el.innerHTML.split(":")[0] === `${master}`) {
        el.setAttribute("class", "active user list-group-item");
      }
    });
  });
}
// // Your choose dealing
const yourCards = document.querySelectorAll(".your_card");

allYourCards.addEventListener("click", e => {
  e.preventDefault();
  if (!added) {
    added = true;
    let card = e.target.closest("div");
    if (card.innerHTML[0] !== "<") {
      card.parentNode.removeChild(card);

      socket.emit("putWhiteCard", { card: card.innerHTML, id });
    }
  }
});

//common board
socket.on("allWhite", data => {
  let markup = ``;
  markup += `<div class="col-sm card border border-dark m-2">
             ${data}
            </div>`;
  commonBoard.insertAdjacentHTML("afterbegin", markup);
});
