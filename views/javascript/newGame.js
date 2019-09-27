const socket = io({ transports: ["websocket"], upgrade: false });

const selectPoints = document.getElementById("points");
const selectCards = document.getElementById("cards");

selectPoints.addEventListener("click", () => {
  points = selectPoints.options[selectPoints.selectedIndex].value;
  socket.emit("setupPoints", { points });
});

selectCards.addEventListener("click", () => {
  cards = selectCards.options[selectCards.selectedIndex].value;
  socket.emit("setupCards", { cards });
});
