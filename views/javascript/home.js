const socket = io({ transports: ["websocket"], upgrade: false });

// const led = document.getElementById("led");

// led.addEventListener("click", () => {
//   if (led.innerHTML === "ON") {
//     led.innerHTML = "OFF";
//   } else {
//     led.innerHTML = "ON";
//   }
//   socket.emit("data", { state: led.innerHTML });
// });
