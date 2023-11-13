const https = require("https");
const http = require("http");
const fs = require('fs');
const path = require("path");
const socketIO = require("socket.io");

class SocketServer {
    app;
    socketServer;
    io;
    port;
    socket;
    constructor( app ) {
        this.app = app;
        this.socketServer = http.Server(app);
        // this.socketServer = https.createServer({
        //     key: fs.readFileSync(path.join(process.env.APP_BASE_URL, "key.pem")),
        //     cert: fs.readFileSync(path.join(process.env.APP_BASE_URL, "cert.pem")),
        //   },
        //   app
        // );
        this.io = socketIO(this.socketServer, {
            transports: ["polling"],
            cors: {
                origin: "*",
            },
        });
    }

    start(port) {
        this.port = port;
        this.socketServer.listen(port, (e) => {
            console.log(`Socket Server running on port ${port}`);
        })
    }

    useSocket(req, res, next) {
        req.io = this.io;
        next();
    }
}

const createServer = (app) => {
    return new SocketServer(app);
}

module.exports = {
    createServer,
    SocketServer
}