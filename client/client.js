const io = require("socket.io-client");

const socket = io("ws://localhost:3000");

socket.on("test", (arg) => {
    console.log(arg); // world
});
