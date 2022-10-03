const express = require("express");
const morgan = require('morgan')
const mongoose = require("mongoose");
const session = require('cookie-session');
const cors = require("cors");
const methodOverride = require('method-override');

require('dotenv').config();

const app = express();

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
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/uploads'));
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

app.use("/", USER_ROUTER);
app.use("/", SUPPORT_ROUTER);
app.use("/", POST_ROUTER);

app.all("*", (req, res) => {
    res.send("don't exist this APIs");
})

const PORT = process.env.PORT || 80;
const HOST = "0.0.0.0"

app.listen(PORT, HOST, (req, res) => {
    console.log(`Server running on port ${PORT}`);
})