const Support = require("../models/supportModel");

exports.submit = async (req, res) => {
    try {
        const support = new Support({
            sender: req.user._id,
            query: req.body.query,
            date: Date.now()
        });
        support.save();
        res.status(400).json({
            state: true,
            data: "Success!"
        })
    } catch (e) {
        console.log(e);
        res.status(400).json({
            state: false,
            errMessage: e
        })
    }
}