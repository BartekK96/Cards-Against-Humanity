const socket = io({ transports: ["websocket"], upgrade: false });

const blackCard = document.getElementById("blackCard");
const allWhiteCards = document.getElementById("allWhiteCards");
const allYourCards = document.getElementById("allYourCards");
const users = document.getElementById("users");
const newGame = document.querySelector(".login-btn");

const selectPoints = document.getElementById("points");
const selectCards = document.getElementById("cards");

let myCards = [];
let boardCards = [];
let master = null;
let masterId = null;
let players = [];
let points;
let added = false;
let ready = false;

// Starting new Game
newGame.addEventListener("click", e => {
  e.preventDefault();
  points = selectPoints.options[selectPoints.selectedIndex].value;
  cards = selectCards.options[selectCards.selectedIndex].value;

  socket.emit("newGameSetup", { points, cards });
});
socket.on("winPoints", data => {
  points = data;
});

socket.on("firstDeal", data => {
  master = data.master;
  masterId = master.id;
  players = data.players;
  myCards = [];
  myCards.push(data.playersCards[id - 1]);
  while (allYourCards.firstChild) {
    allYourCards.removeChild(allYourCards.firstChild);
  }
  let markup = "";
  for (let i = 0; i < myCards[0].length; i++) {
    markup += `<div class="col-sm card border border-dark m-2">${myCards[0][i]}</div>`;
  }
  allYourCards.insertAdjacentHTML("afterbegin", markup);
  markup = "";
  for (let i = 0; i < players.length; i++) {
    markup += `<li class="active user list-group-item">${players[i].login}: ${players[i].points}/${points}</li>`;
  }
  while (users.firstChild) {
    users.removeChild(users.firstChild);
  }
  users.insertAdjacentHTML("afterbegin", markup);
  removingActive(master.login);
});

socket.on("firstBlack", data => {
  while (blackCard.firstChild) {
    blackCard.removeChild(blackCard.firstChild);
  }
  let markup = ``;
  markup += `<div class="card-body">
                <p class="card-text">
                ${data[0].description}
                </p>
              </div>`;
  blackCard.insertAdjacentHTML("afterbegin", markup);
});

// common player put white card

allYourCards.addEventListener("click", e => {
  e.preventDefault();
  if (masterId !== id) {
    if (!added) {
      added = true;
      let card = e.target.closest("div");
      if (card.innerHTML[0] !== "<") {
        card.parentNode.removeChild(card);
        socket.emit("putWhiteCard", { card: card.innerHTML, id });
      }
    }
  }
});
allWhiteCards.addEventListener("click", e => {
  e.preventDefault();

  ready = allWhiteCards.childElementCount === players.length - 1;

  if (masterId === id) {
    if (ready) {
      ready = false;
      let card = e.target.closest("div");
      if (card.innerHTML[0] !== "<") {
        socket.emit("whiteChoose", { card: card.innerHTML });
      }
    }
  }
});

// common board
socket.on("allWhite", data => {
  let markup = ``;
  markup += `<div class="col-sm card border border-dark m-2">${data}</div>`;
  allWhiteCards.insertAdjacentHTML("afterbegin", markup);
});
// newWhiteDeal
socket.on("newWhiteDeal", data => {
  myCards = data;
  while (allYourCards.firstChild) {
    allYourCards.removeChild(allYourCards.firstChild);
  }
  let markup = "";
  for (let i = 0; i < myCards.length; i++) {
    markup += `<div class="col-sm card border border-dark m-2">${myCards[i]}</div>`;
  }
  allYourCards.insertAdjacentHTML("afterbegin", markup);
});

socket.on("playersPoints", data => {
  for (let i = 0; i < players.length; i++) {
    players[i].points = data[players[i].id - 1];
  }
  updatePoints();
});

socket.on("newRound", data => {
  added = false;
  master = data.master;
  masterId = data.master.id;
  while (blackCard.firstChild) {
    blackCard.removeChild(blackCard.firstChild);
  }
  while (allWhiteCards.firstChild) {
    allWhiteCards.removeChild(allWhiteCards.firstChild);
  }
  let markup = ``;
  markup += `<div class="card-body">
                <p class="card-text">
                ${data.res[0].description}
                </p>
              </div>`;
  blackCard.insertAdjacentHTML("afterbegin", markup);
});

// changing master front
const removingActive = master => {
  // removing active
  const allUsers = document.querySelectorAll(".user");
  allUsers.forEach.call(allUsers, function(el) {
    el.classList.remove("active");

    if (el.innerHTML.split(":")[0] === `${master}`) {
      el.setAttribute("class", "active user list-group-item");
    }
  });
};

const updatePoints = () => {
  markup = "";
  for (let i = 0; i < players.length; i++) {
    markup += `<li class="active user list-group-item">${players[i].login}: ${players[i].points}/${points}</li>`;
  }
  while (users.firstChild) {
    users.removeChild(users.firstChild);
  }
  users.insertAdjacentHTML("afterbegin", markup);
  removingActive(master.login);
};
