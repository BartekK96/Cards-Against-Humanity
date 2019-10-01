const socket = io({ transports: ["websocket"], upgrade: false });

const blackCard = document.getElementById("blackCard");
const allWhiteCards = document.getElementById("allWhiteCards");
const allYourCards = document.getElementById("allYourCards");
const users = document.getElementById("users");
const newGame = document.querySelector(".login-btn");

const selectPoints = document.getElementById("points");
const selectCards = document.getElementById("cards");

let myCards = [];

// Starting new Game
newGame.addEventListener("click", e => {
  e.preventDefault();
  points = selectPoints.options[selectPoints.selectedIndex].value;
  cards = selectCards.options[selectCards.selectedIndex].value;

  socket.emit("newGameSetup", { points, cards });
});

socket.on("firstDeal", data => {
  myCards = [];
  myCards.push(data[id - 1]);

  while (allYourCards.firstChild) {
    allYourCards.removeChild(allYourCards.firstChild);
  }
  let markup = "";
  for (let i = 0; i < myCards[0].length; i++) {
    console.log(myCards[0][i]);
    markup += `<div class="col-sm card border border-dark m-2">
                ${myCards[0][i]}
              </div>`;
  }
  allYourCards.insertAdjacentHTML("afterbegin", markup);
});
