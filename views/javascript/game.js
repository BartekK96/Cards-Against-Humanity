const socket = io({ transports: ["websocket"], upgrade: false });

const blackCard = document.getElementById("blackCard");
const allWhiteCards = document.getElementById("allWhiteCards");
const allYourCards = document.getElementById("allYourCards");
const users = document.getElementById("users");

console.log(id);

socket.on("sendSetup", data => {
  let markup = "";
  for (let i = 0; i < data.res.length; i++) {
    markup += `<div>${data.res[i].login}: ${data.res[i].points}/${data.winPoints}</div>`;
  }
  console.log(data.res);
  socket.emit("gameStarted", { data });

  users.insertAdjacentHTML("afterbegin", markup);
});
socket.on("sendStartCards", data => {
  console.log(data);
});
