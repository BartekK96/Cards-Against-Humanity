const socket = io({ transports: ["websocket"], upgrade: false });

socket.on("sendSetup", data => {
  console.log(data);
});
