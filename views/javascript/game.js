const socket = io(); // { transports: ["websocket"], upgrade: false }

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
let gameStarted = false;
let numberOfWhiteToAdd = 0;
let numberAlreadyAdded = 0;
let newRound = false;
let choosenWhite = [];

socket.on("winPoints", data => {
  boardCards = [];
  points = data;
  ready = false;
  added = false;
  numberAlreadyAdded = 0;
});

// redirect
if (window.performance) {
  socket.emit("refreshReq", true);
  socket.on("gameStarted", data => {
    gameStarted = data;

    if (
      (performance.navigation.type === 1 &&
        performance.navigation.redirectCount === 0 &&
        gameStarted) ||
      (performance.navigation.type === 0 &&
        performance.navigation.redirectCount === 0 &&
        gameStarted)
    ) {
      socket.on("refreshDeal", data => {
        if (data.playersAdded[id - 1] === 1) {
          added = true;
        }

        points = data.winPoints;
        master = data.master;
        masterId = master.id;
        players = data.players;
        numberOfWhiteToAdd = data.numberOfWhiteToAdd;
        myCards = [];
        myCards.push(data.playersCards[id - 1]);
        while (allYourCards.firstChild) {
          allYourCards.removeChild(allYourCards.firstChild);
        }
        let markup = "";
        for (let i = 0; i < myCards[0].length; i++) {
          markup += `<div class="col-sm card border border-dark m-2 white">${myCards[0][i].description}</div>`;
        }
        allYourCards.insertAdjacentHTML("afterbegin", markup);
        markup = "";

        for (let i = 0; i < players.length; i++) {
          markup += `<li class="act user list-group-item">${players[i].login}: ${players[i].points}/${points}</li>`;
        }
        while (users.firstChild) {
          users.removeChild(users.firstChild);
        }
        users.insertAdjacentHTML("afterbegin", markup);
        removingActive(master.login);

        while (blackCard.firstChild) {
          blackCard.removeChild(blackCard.firstChild);
        }

        markup = "";
        markup += `<div class="card-body black">
                      <p class="card-text">
                      ${data.currentBlack.description}
                      </p>
                    </div>`;
        blackCard.insertAdjacentHTML("afterbegin", markup);
        markup = "";
        boardCards = data.choosenWhite;

        markup = "";

        for (let i = 0; i < boardCards.length; i++) {
          markup += "<div class='col'>";
          for (let j = 0; j < boardCards[i].length; j++) {
            markup += `<div class="card border border-dark m-2 white">${boardCards[i][j][0].description}</div>`;
          }
          markup += "</div>";
        }
        allWhiteCards.insertAdjacentHTML("afterbegin", markup);
      });
    }
  });
}

socket.on("firstDeal", data => {
  boardCards = [];
  numberAlreadyAdded = 0;
  gameStarted = true;
  master = data.master;
  masterId = master.id;
  players = data.players;
  numberOfWhiteToAdd = data.numberOfWhiteToAdd;
  myCards = [];
  myCards.push(data.playersCards[id - 1]);
  while (allWhiteCards.firstChild) {
    allWhiteCards.removeChild(allWhiteCards.firstChild);
  }
  while (allYourCards.firstChild) {
    allYourCards.removeChild(allYourCards.firstChild);
  }
  let markup = "";
  for (let i = 0; i < myCards[0].length; i++) {
    markup += `<div class="col-sm card border border-dark m-2 white">${myCards[0][i].description}</div>`;
  }
  allYourCards.insertAdjacentHTML("afterbegin", markup);
  markup = "";
  for (let i = 0; i < players.length; i++) {
    markup += `<li class="act user list-group-item">${players[i].login}: ${players[i].points}/${points}</li>`;
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
  markup += `<div class="card-body black">
                <p class="card-text">
                ${data.description}
                </p>
              </div>`;
  blackCard.insertAdjacentHTML("afterbegin", markup);
});

// common player put white card

allYourCards.addEventListener("click", e => {
  e.preventDefault();
  if (masterId !== id) {
    if (!added) {
      let card = e.target.closest("div");

      if (card.innerHTML[0] !== "<") {
        card.parentNode.removeChild(card);
        numberAlreadyAdded++;
        socket.emit("putWhiteCard", { card: card.innerHTML, id });
      }
      if (numberAlreadyAdded === numberOfWhiteToAdd) {
        added = true;
      } else {
        added = false;
      }
    }
  }
});

allWhiteCards.addEventListener("click", e => {
  e.preventDefault();
  let num = 0;

  for (let i = 0; i < boardCards.length; i++) {
    num += boardCards[i].length;
  }

  if ((players.length - 1) * numberOfWhiteToAdd === num) {
    ready = true;
  }

  if (masterId === id) {
    if (ready) {
      let card = e.target.closest("div");
      if (card.innerHTML[0] !== "<") {
        ready = false;
        socket.emit("whiteChoose", { card: card.innerHTML });
      }
    }
  }
});

socket.on("whiteChoose", data => {
  newRound = true;
  choosenWhite = data;
  while (allWhiteCards.firstChild) {
    allWhiteCards.removeChild(allWhiteCards.firstChild);
  }

  for (let i = 0; i < boardCards.length; i++) {
    for (let j = 0; j < boardCards[i].length; j++) {
      if (choosenWhite[0].description === boardCards[i][j][0].description) {
        boardCards = [[], [], [], [], [], [], [], [], []];
        boardCards[i].push(choosenWhite);
        break;
      }
    }
  }

  let markup = "";

  for (let i = 0; i < boardCards.length; i++) {
    markup += "<div class='col'>";
    for (let j = 0; j < boardCards[i].length; j++) {
      markup += `<div class="card border border-dark m-2 black">${boardCards[i][j][0].description}</div>`;
    }
    markup += "</div>";
  }
  allWhiteCards.insertAdjacentHTML("afterbegin", markup);

  if (id === masterId) {
    console.log(newRound);
    if (newRound) {
      console.log(2);
      const interval = setInterval(() => {
        console.log(3);
        if (!newRound) {
          console.log(4);
          socket.emit("new", true);
          clearInterval(interval);
        }
        window.addEventListener("click", e => {
          e.preventDefault();
          newRound = false;
        });
      }, 100);
    }
  }
});

// common board
socket.on("allWhite", data => {
  boardCards = data;
  let markup = "";
  for (let i = 0; i < data.length; i++) {
    markup += "<div class='col'>";
    for (let j = 0; j < data[i].length; j++) {
      markup += `<div class="card border border-dark m-2 white">${data[i][j][0].description}</div>`;
    }
    markup += "</div>";
  }
  allWhiteCards.insertAdjacentHTML("afterbegin", markup);
});
// newWhiteDeal
socket.on("newWhiteDeal", data => {
  myCards = data[id - 1];
  while (allYourCards.firstChild) {
    allYourCards.removeChild(allYourCards.firstChild);
  }
  let markup = "";
  for (let i = 0; i < myCards.length; i++) {
    markup += `<div class="col-sm card border border-dark m-2 white">${myCards[i].description}</div>`;
  }
  allYourCards.insertAdjacentHTML("afterbegin", markup);
});

socket.on("playersPoints", data => {
  for (let i = 0; i < players.length; i++) {
    players[i].points = data[players[i].id - 1];
    if (Number(players[i].points) === Number(points)) {
      console.log("Game is Finished!");
      socket.emit("gameFinish", true);
    }
  }

  updatePoints();
});

socket.on("newRound", data => {
  newRound = false;
  boardCards = [];
  numberOfWhiteToAdd = data.numberOfWhiteToAdd;
  numberAlreadyAdded = 0;
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
  markup += `<div class="card-body black">
                <p class="card-text">
                ${data.currentBlack.description}
                </p>
              </div>`;
  blackCard.insertAdjacentHTML("afterbegin", markup);
  removingActive(master.login);
});

// changing master front
const removingActive = master => {
  // removing active
  const allUsers = document.querySelectorAll(".user");
  allUsers.forEach.call(allUsers, function(el) {
    el.classList.remove("act");

    if (el.innerHTML.split(":")[0] === `${master}`) {
      el.setAttribute("class", "act user list-group-item");
    }
  });
};

const updatePoints = () => {
  markup = "";
  for (let i = 0; i < players.length; i++) {
    markup += `<li class="act user list-group-item ">${players[i].login}: ${players[i].points}/${points}</li>`;
  }
  while (users.firstChild) {
    users.removeChild(users.firstChild);
  }
  users.insertAdjacentHTML("afterbegin", markup);
  removingActive(master.login);
};
