const jwt = require('jsonwebtoken');

function Need_Authentification(req, res, next) {
    // if (req.session.user) {
        return next()
    // }

    // console.log('You need to login')
    // res.status(400).json({
    //     state: false,
    //     data: "You need to login"
    // })
}

function Should_Not_Be_Authenticated(req, res, next) {
    // console.log("Should_Not_Be_Authenticated, session:", req.session.user);
    // if (req.session.user) {
    //     console.log('you are already auth')
    //     res.status(200).send({
    //         state: false,
    //         errMessage: "already"
    //     })
    // } else {
        next()
    // }
}

function verifyToken(req, res, next) {
    try {
        const bearerHeader = req.headers['authorization'];
        let hasToken = false
        if (typeof bearerHeader !== 'undefined') {
            const arr = bearerHeader.split(' ')
            if (arr.length === 2) {
                if(arr[0] === 'Bearer') {
                    req.token = arr[1]
                    next();
                    hasToken = true
                }
            }
        }
        if( hasToken === false ) {
            res.status(400).json({
                state: false,
                data: "Not logged-in"
            })
        }
    } catch (error) {
        res.status(401).json({ message: "Auth failed!" });
    }
}

function tokenAnalyze(req, res, next) {
    try {
        jwt.verify(req.token, process.env.SECRET_KEY, (error, authData) => {
            if (error) {
                res.status(400).json({
                    status: false,
                    data: "Please login"
                })
            }
            req.user = authData.user;
            // if (req.user !== req.session.user._id) {
            //     res.status(400).json({
            //         status: false,
            //         data: "System Error!"
            //     })
            // } else {
                next();
            // }
        })
    } catch (error) {
        res.status(400).json({
            status: false,
            data: error
        })
    }
}

async function locationAnalyze(req, res, next) {
    try {
        fetch(`https://ipapi.co/${req.ip}/json/`).then((response) => {
            response.json().then((jsonData) => {
                if(jsonData.reserved) req.body.location = "LOCAL"
                else req.body.location = jsonData.country_code;
                next()
            }).catch((err) => {
                throw err
            })
        }).catch((err) => {
            console.log(err)
            throw err
        });
    } catch (error) {
        req.body.location = "LOCAL"
        next();
    }
}

module.exports = { Need_Authentification, Should_Not_Be_Authenticated, verifyToken, tokenAnalyze, locationAnalyze }