const socket = io(); // { transports: ["websocket"], upgrade: false }

const newGame = document.querySelector(".login-btn");

const selectPoints = document.getElementById("points");
const selectCards = document.getElementById("cards");

let cards;
let points;
socket.on("allowNewGame", data => {
  if (data) {
    newGame.disabled = false;
    newGame.addEventListener("click", e => {
      points = selectPoints.options[selectPoints.selectedIndex].value;
      cards = selectCards.options[selectCards.selectedIndex].value;

      socket.emit("newGameSetup", { points, cards });
    });
  }
});
