const express = require("express");
const morgan = require('morgan')
const mongoose = require("mongoose");
const session = require('cookie-session');
const cors = require("cors");
const methodOverride = require('method-override');
const fs = require('fs');
const path = require("path");
const { existsSync } = require("fs");
process.env.APP_BASE_URL = __dirname;
const dotenv = require("dotenv");
const env = path.join(process.env.APP_BASE_URL, ".env");
const envProduction = path.join(process.env.APP_BASE_URL, ".env.production");
if(existsSync(env)) dotenv.config({path: env});
else dotenv.config({path: envProduction});
const socketIO = require("socket.io");
const { socketEvent } = require("./controllers/userController");


const app = express();
const http = require("http").Server(app);
// const https = require("https").createServer({
//     key: fs.readFileSync(path.join(process.env.APP_BASE_URL, "key.pem")),
//     cert: fs.readFileSync(path.join(process.env.APP_BASE_URL, "cert.pem")),
//   },
//   app
// );

const { createServer } = require("./utils/SocketServer");
const socketServer = createServer(app);
socketEvent(socketServer.io, (socket) => {socketServer.socket = socket});
socketServer.start(process.env.SOCKET_PORT);
module.exports = { socketServer };

mongoose.connect(`${process.env.DATABASE_URL}`, (err) => {
    const dbState = [{
        value: 0,
        label: "Disconnected"
    }, {
        value: 1,
        label: "Connected"
    }, {
        value: 2,
        label: "Connecting"
    }, {
        value: 3,
        label: "Disconnecting"
    }], state = mongoose.connection.readyState;
    console.log(dbState.find(f => f.value == state).label); // connected to db
});

app.use(cors());

app.set('trust proxy', 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
// app.use(express.static(__dirname + '/public'));
app.use("/api", express.static(__dirname + '/uploads'));
app.use(morgan('dev'));

app.use(
    session({
        keys: [process.env.SECRET_KEY ? process.env.SECRET_KEY : 'secret'],
        maxAge: +process.env.EXPIRE_TIME // 1.5 hours
    })
);

app.use((req, res, next) => {
    console.log(req.body);
    next();
})

const USER_ROUTER = require("./router/users.js");
const SUPPORT_ROUTER = require("./router/support.js");
const POST_ROUTER = require("./router/post.js");
const SOURCE_ROUTER = require("./router/source.js");
global.socketIds = {};
global.socketUserid = {};

app.use("/api/v1/", USER_ROUTER);
app.use("/api/v1/", SUPPORT_ROUTER);
app.use("/api/v1/", POST_ROUTER);
app.use("/api/source/", SOURCE_ROUTER)

app.all("*", (req, res) => {
    res.send(404, "don't exist this APIs");
})

const PORT = process.env.PORT || 80;
const HOST = "0.0.0.0"

app.listen(PORT, HOST, (req, res) => {
    console.log(`Server running on port ${PORT}`);
})
// https.listen(PORT, () => {
//     console.log(`Https serever is runing at port ${PORT}`);
// });