const User = require("../models/userModel");
const Post = require("../models/postModel");
const Notification = require("../models/notificationModel");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { unlink, rename } = require('fs')
require('dotenv').config();
const Sib = require('sib-api-v3-sdk')
const client = Sib.ApiClient.instance
const apiKey = client.authentications['api-key']
apiKey.apiKey = process.env.API_KEY
const tranEmailApi = new Sib.TransactionalEmailsApi()

const { postTypes, postsDisplayModes } = require("../middlewares/const");
const { createProfilePicture, generateRandomName, randomDegitalNumber } = require("../middlewares/function");

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        let user = await User.findOne({ email: email })
        if (!user) throw ('Email or Password Invalid')
        if (!bcrypt.compareSync(password, user.password)) throw ('Email or Password Invalid');

        user.updateInactiveDate();
        await user.save();

        let token = jwt.sign({
            user: {
                _id: user._id
            }
        }, process.env.SECRET_KEY, {
            expiresIn: process.env.EXPIRE_TIME * 1000
        });

        req.session.user = user;

        return res.status(200).json({
            status: true,
            token: token,
            data: user
        })
    } catch (e) {
        console.log(e);
        return res.status(400).json({
            status: false,
            errMessage: e
        });
    }
}

exports.signUp = async (req, res) => {
    try {
        let { username, password } = req.body;
        const isUsernameTaken = await User.findOne({ email: email })
        if (isUsernameTaken) throw 'This Email is Already Taken'

        req.session.user = null;

        const user = new User({
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            email: req.body.email,
            phone: req.body.phone,
            country: req.body.country,
            username: req.body.firstname.trim() + " " + req.body.lastname.trim(),
            password: bcrypt.hashSync(password, 11)
        });

        await user.save();

        user.profile_image_path = createProfilePicture('default-profile.png');
        await user.save();

        user.email_verification_code = randomDegitalNumber(6);
        await user.save();

        const sender = {
            email: 'Contact@gadelapp.com',
            name: 'From name',
        }
        const receivers = [
            {
                email: 'dazzlingstar0831@gmail.com',
            },
        ]
        tranEmailApi
            .sendTransacEmail({
                sender,
                to: receivers,
                subject: 'Gadel Email Verification Code',
                textContent: `gadel email verification`,
                htmlContent: `<h1>Please use this code to verify your account ${user.email_verification_code}. Never share it with anyone.</h1>`,
                params: {
                    role: 'Frontend',
                },
            })
            .then(console.log)
            .catch(console.log)


        res.status(200).json({
            status: true,
        })
    } catch (e) {
        console.log(e);
        res.status(400).json({
            status: false,
            errMessage: e
        })
    }
}

exports.emailVerify = async (req, res) => {
    try {
        let user = await User.findOne({ _id: req.user._id });
        console.log(user);
        if (user) {
            if (user.email_verification_code == req.body.emailVerificationCode) {
                user.email_active = true;
                await user.save();
                res.status(200).json({
                    status: true,
                })
            } else {
                throw "Invaid Code";
            }
        } else {
            throw "System Error!"
        }
    } catch (e) {
        console.log(e);
        res.status(400).json({
            state: false,
            errMessage: e
        })
    }
}

exports.getUserInfo = async (req, res) => {
    try {
        let user = await User.findOne({ _id: req.user._id });
        if (user) {
            const posts = await Post.find({ userId: req.user._id });
            res.status(200).json({
                state: true,
                userData: user,
                posts: posts
            })
        } else {
            res.status(400).json({
                state: false,
            })
        }
    } catch (e) {
        console.log(e);
        res.status(400).json({
            state: false,
            errMessage: e
        })
    }
}

exports.changeLanguage = async (req, res) => {
    try {
        if (!req.body.language) throw 'Invalid Param';
        let user = await User.findOne({ _id: req.user._id });
        if (user) {
            user.setting.language = req.body.language;
            await user.save();
            res.status(200).json({
                state: true,
            })
        } else {
            res.status(400).json({
                state: false,
            })
        }
    } catch (e) {
        console.log(e);
        res.status(400).json({
            state: false,
            errMessage: e
        })
    }
}

exports.changeEmailUsername = async (req, res) => {
    try {
        let user = await User.findOne({ _id: req.user._id });
        if (user) {
            user.email = req.body.email;
            user.username = req.body.username;
            await user.save();
            res.status(200).json({
                state: true,
            })
        } else {
            res.status(400).json({
                state: false,
            })
        }
    } catch (e) {
        console.log(e);
        res.status(400).json({
            state: false,
            errMessage: e
        })
    }
}

exports.changeDeactivate = async (req, res) => {
    try {
        if (!req.body.deactivate) throw ("invalid deactivate!");
        let user = await User.findOne({ _id: req.user._id });
        if (user) {
            user.setting.deactivate = req.body.deactivate;
            await user.save();
            res.status(200).json({
                state: true,
            })
        } else {
            res.status(400).json({
                state: false,
            })
        }
    } catch (e) {
        console.log(e);
        res.status(400).json({
            state: false,
            errMessage: e
        })
    }
}

exports.changePostType = async (req, res) => {
    try {
        if (!req.body.postType || postTypes.indexOf(req.body.postType) == -1) throw ("invalid postType!");
        let user = await User.findOne({ _id: req.user._id });
        if (user) {
            user.setting.postType = req.body.postType;
            await user.save();
            res.status(200).json({
                state: true,
            })
        } else {
            res.status(400).json({
                state: false,
                errMessage: "System Error!"
            })
        }
    } catch (e) {
        console.log(e);
        res.status(400).json({
            state: false,
            errMessage: e
        })
    }
}

exports.changePostsDisplayMode = async (req, res) => {
    try {
        if (!req.body.postsDisplayMode || postsDisplayModes.indexOf(req.body.postsDisplayMode) == -1) throw ("invalid postsDisplayMode!");
        let user = await User.findOne({ _id: req.user._id });
        if (user) {
            user.setting.postsDisplayMode = req.body.postsDisplayMode;
            await user.save();
            res.status(200).json({
                state: true,
            })
        } else {
            res.status(400).json({
                state: false,
            })
        }
    } catch (e) {
        console.log(e);
        res.status(400).json({
            state: false,
            errMessage: e
        })
    }
}

exports.changeProfileImage = async (req, res) => {
    try {
        const file = req.files.file;
        const path = 'uploads/userImg/' + generateRandomName(file.name, 17);
        file.mv(path, (err) => {
            if (err) {
                throw "faild file move"
            }
        });

        let user = await User.findOne({ _id: req.user._id });
        if (user) {
            const delete_path = user.profile_image_path;
            unlink(delete_path, (err) => {
                if (err) throw (`No file to delete at this location: ${path}`)
            });
            user.profile_image_path = path;
            await user.save();
            res.status(200).json({
                state: true,
                data: path,
            })
        } else {
            unlink(path, (err) => {
                if (err) throw (`No file to delete at this location: ${path}`)
            });
            throw "system error"
        }


        res.status(200).json({
            state: true,
            data: path
        });
    } catch (err) {
        res.status(400).json({
            state: false,
            errMessage: err
        });
    }
}

exports.addFollower = async (req, res) => {
    try {
        if (!req.body.userId) throw "invalid userId"
        if (!req.body.postId) throw "invalid postId"
        let user = await User.findOne({ _id: req.user._id });
        if (user.follows.find(item => item.userId == req.body.userId)) throw 'This user already is followed'
        user.follows.push({
            "userId": req.body.userId + "",
            "postId": req.body.postId + "",
            "date": Date.now()
        })
        await user.save()

        const notification = new Notification()
        notification.userId = req.user._id
        notification.type = "follow"
        notification.text = `"${user.username}" followed you.`
        notification.date = Date.now()
        notification.receivers = [req.body.userId]
        await notification.save()

        res.status(200).json({
            state: true,
            data: 'success'
        });
    } catch (err) {
        console.log(err)
        res.status(400).json({
            state: false,
            errMessage: err
        });
    }
}

exports.deleteFollower = async (req, res) => {
    try {
        if (!req.body.userId) throw "invalid userId"
        // userId is removed in caller's follows
        let user = await User.findOne({ _id: req.user._id });
        if (!user.follows.find(item => item.userId == req.body.userId)) throw 'This user has not been followed'
        user.follows = user.follows.filter(item => item.userId !== req.body.userId);
        await user.save()

        // Caller's Id is removed in UserId's follows
        let unfollower = await User.findOne({ _id: req.body.userId })
        console.log(unfollower.follows)
        unfollower.follows = unfollower.follows.filter(item => item.userId !== req.user._id)
        console.log(unfollower.follows)
        await unfollower.save()

        // add in notification
        const notification = new Notification()
        notification.userId = req.user._id
        notification.type = "follow"
        notification.text = `"${user.username}" unfollowed you.`
        notification.date = Date.now()
        notification.receivers = [req.body.userId]
        await notification.save()

        res.status(200).json({
            state: true,
            data: 'success'
        });
    } catch (err) {
        console.log(err);
        res.status(400).json({
            state: false,
            data: err
        });
    }
}

exports.allowFollower = async (req, res) => {
    try {
        let user = await User.findOne({ _id: req.user._id })
        // Folows of the user that follows current user activate. - my
        user.follows.push({
            "userId": req.body.userId + "",
            "date": Date.now(),
            "isActive": true
        })
        await user.save()

        // followed user's follows activate. - other
        let followedUser = await User.findOne({ _id: req.body.userId })
        followedUser.follows = followedUser.follows.map(item => item.userId == req.user._id ? { ...item, isActive: true } : item);
        console.log(followedUser.follows)
        await followedUser.save()

        res.status(200).json({
            state: true,
            data: 'success'
        });
    } catch (err) {
        console.log(err);
        res.status(400).json({
            state: false,
            errMessage: err
        });
    }
}