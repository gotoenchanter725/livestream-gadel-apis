const express = require("express");
const morgan = require('morgan')
const mongoose = require("mongoose");
const session = require("express-session");
const cors = require("cors");
const methodOverride = require('method-override');

require('dotenv').config();

const app = express();

mongoose.connect(`mongodb://localhost:27017/${process.env.DATABASE_NAME}`, (err) => {
    const dbState = [{
        value: 0,
        label: "disconnected"
    }, {
        value: 1,
        label: "connected"
    }, {
        value: 2,
        label: "connecting"
    }, {
        value: 3,
        label: "disconnecting"
    }], state = mongoose.connection.readyState;
    console.log(dbState.find(f => f.value == state).label, `to ${process.env.DATABASE_NAME} db`); // connected to db
});

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/uploads'));
app.use(morgan('dev'));

app.use(
    session({
        secret: process.env.SECRET_KEY ? process.env.SECRET_KEY : 'secret',
        resave: true,
        saveUninitialized: true,
        cookie: { maxAge: +process.env.EXPIRE_TIME }, // 1.5 hours
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

app.listen(process.env.PORT, (req, res) => {
    console.log(`Server running on port ${process.env.PORT}`);
})