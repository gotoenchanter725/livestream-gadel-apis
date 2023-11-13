const User = require("../models/userModel");
const Post = require("../models/postModel");
const Message = require("./../models/messageModel");
const Notification = require("../models/notificationModel");
const Gift = require("../models/giftModel");
const GiftList = require("./../models/giftListModel");
const mongoose = require('mongoose');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Lib = require("simple-libs");
const { unlink, rename, existsSync } = require('fs');
require('dotenv').config();

const mail = new Lib.Email.InBlue(process.env.API_KEY);

const { postTypes, postsDisplayModes } = require("../middlewares/const");
const { createProfilePicture, generateRandomName, randomDegitalNumber, createCoverPicture, generateRandomString } = require("../middlewares/function");
const { resolve } = require("path");
const path = require("path");
const { default: axios } = require("axios");

exports.DEFAULT_AVATAR = path.join(process.env.APP_BASE_URL, "public/default/male.png");
exports.DEFAULT_COVER = path.join(process.env.APP_BASE_URL, "public/default/profile-header.png");
exports.DEFAULT_GIFT = path.join(process.env.APP_BASE_URL, "public/default/profile-header.png");
exports.MIN_FOLLOWS = 3000;
exports.SEND_GIFT_FEE = 0.25;

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        let user = await User.findOne({ email: email })
        if (!user) throw ('Email or Password Invalid')
        if (!bcrypt.compareSync(password, user.password)) throw ('Email or Password Invalid');
        user.updateInactiveDate();
        await user.save();
        if(!user.email_active) {
            return res.status(200).json({
                status: false,
                code: 100,
                errMessage:"Please verify email"
            })
        }
        let token = jwt.sign({
            user: {
                _id: user._id,
                username: user.username
            }
        }, process.env.SECRET_KEY, {
            expiresIn: process.env.EXPIRE_TIME * 1000
        });

        req.session.user = user;

        return res.status(200).json({
            status: true,
            token: token,
            user: user
        })
    } catch (e) {
        return res.status(400).json({
            status: false,
            errMessage: e
        });
    }
}

exports.signUp = async (req, res) => {
    try {
        let { email, password } = req.body;
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
            password: bcrypt.hashSync(password, 11),
            official: req.body.isOfficial
        });

        await user.save();

        user.profile_image_path = createProfilePicture('default-profile.png');
        user.setting.coverImage = createCoverPicture('default-cover.png');
        user.email_verification_code = randomDegitalNumber(6);
        await user.save();

        mail.sendMail(
            "contact@gadelapp.com", 
            "Gadel App Support", 
            [req.body.email.trim()],
            "Gadel Email Verification Code",
            "Verify",
            `<div style='text-align:center'><h3>Please verify your email</h3><label>${user.email_verification_code}</label></div>`
        );

        res.status(200).json({
            status: true,
        })
    } catch (e) {
        res.status(400).json({
            status: false,
            errMessage: e
        })
    }
}

exports.emailVerify = async (req, res) => {
    try {
        let user = await User.findOne({ email_verification_code: String(req.body.emailVerificationCode) });
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
        res.status(400).json({
            state: false,
            errMessage: e
        })
    }
}

exports.getUserInfo = async (req, res) => {
    try {
        let userid = req.query.userId;
        if( userid == null ) userid = req.user._id
        let user = await User.findOne({ _id: userid }).select([
            'firstname',
            'lastname',
            'username',
            'profile_image_path',
            'country',
            'setting',
            'follows',
            'official',
            'officialActive',
            'information'
        ]);
        if (user) {
            const posts = await Post.find({ userId: userid });
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
        res.status(400).json({
            state: false,
            errMessage: e
        })
    }
}

exports.changeProfileImage = async (req, res) => {
    try {
        const file = req.files.file;
        const file_path = 'userImg/' + generateRandomName(file.name, 17);
        const path = 'uploads/'+file_path
        file.mv(path, (err) => {
            if (err) {
                throw "faild file move"
            }
        });

        let user = await User.findOne({ _id: req.user._id });
        if (user) {
            const delete_path = "uploads/"+user.profile_image_path;
            let tt = resolve(delete_path)

            existsSync("uploads"+delete_path) && unlink(delete_path, (err) => {
                if (err) throw (`No file to delete at this location: ${path}`)
            });
            user.profile_image_path = file_path;
            await user.save();
            res.status(200).json({
                state: true,
                data: file_path,
            })
        } else {
            unlink(path, (err) => {
                if (err) throw (`No file to delete at this location: ${path}`)
            });
            throw "system error"
        }
    } catch (err) {
        return res.status(400).json({
            state: false,
            errMessage: err
        });
    }
}

exports.changeCoverImage = async (req, res) => {
    try {
        const file = req.files.file;
        const file_name = generateRandomName(file.name, 17);
        const path = 'uploads/cover/'+file_name
        file.mv(path, (err) => {
            if (err) {
                throw "faild file move"
            }
        });

        let user = await User.findOne({ _id: req.user._id });
        if (user) {
            const delete_path = "uploads/cover/"+user.setting.coverImage
            let tt = resolve(delete_path)
            existsSync(tt) && unlink(tt, (err) => {
                if (err) throw (`No file to delete at this location: ${path}`)
            });
            user.setting.coverImage = file_name;
            await user.save();
            res.status(200).json({
                state: true,
                data: file_name,
            })
        } else {
            unlink(path, (err) => {
                if (err) throw (`No file to delete at this location: ${path}`)
            });
            throw "system error"
        }
    } catch (err) {
        return res.status(400).json({
            state: false,
            errMessage: err
        });
    }
}

exports.addFollower = async (req, res) => {
    try {
        if (!req.body.userId || !!!(await User.findOne({ _id: req.body.userId }))) throw "invalid userId"
        // if (!req.body.postId) throw "invalid postId"
        let user = await User.findOne({ _id: req.user._id });
        const fi = user.follows.findIndex(item => item.userId == req.body.userId);
        if ( fi > -1 ) throw 'This user already is followed'
        user.follows.push({
            "userId": req.body.userId + "",
            // "postId": req.body.postId + "",
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

        const socketId = global.socketIds[req.body.userId];
        if( socketId ) {
            notification.receivers = null;
            req.io.to(socketId).emit("new-notificaiton", notification);
        }

        res.status(200).json({
            state: true,
            data: 'success',
            follows: user.follows
        });
    } catch (err) {
        res.status(400).json({
            state: false,
            errMessage: err
        });
    }
}

exports.deleteFollower = async (req, res) => {
    try {
        if (!req.query.userId) throw "invalid userId"
        // userId is removed in caller's follows
        let user = await User.findOne({ _id: req.user._id });
        const fi = user.follows.findIndex(item => item.userId == req.query.userId);
        if( fi < 0 ) throw 'This user has not been followed'
        user.follows = user.follows.filter(item => item.userId !== req.query.userId);
        await user.save()

        // // Caller's Id is removed in UserId's follows
        // let unfollower = await User.findOne({ _id: req.body.userId })
        // console.log(unfollower.follows)
        // unfollower.follows = unfollower.follows.filter(item => item.userId !== req.user._id)
        // console.log(unfollower.follows)
        // await unfollower.save()

        // add in notification
        const notification = new Notification()
        notification.userId = req.user._id
        notification.type = "follow"
        notification.text = `"${user.username}" unfollowed you.`
        notification.date = Date.now()
        notification.receivers = [req.query.userId]
        await notification.save()

        const socketId = global.socketIds[req.query.userId];
        if( socketId ) {
            notification.receivers = null;
            req.io.to(socketId).emit("new-notificaiton", notification);
        }

        res.status(200).json({
            state: true,
            data: 'success',
            follows: user.follows
        });
    } catch (err) {
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
        await followedUser.save()

        res.status(200).json({
            state: true,
            data: 'success',
            follows: user.follows
        });
    } catch (err) {
        res.status(400).json({
            state: false,
            errMessage: err
        });
    }
}

exports.getUserAvatar = async (req, res) => {
    const userId = req.params.userid;
    try {
        const user = await User.findOne({ _id: userId })
        if ( user ) {
            const filePath = path.join(process.env.APP_BASE_URL, `uploads/${user.profile_image_path}`);
            if(existsSync(filePath)) res.sendFile(filePath);
            else throw "now exist";
        } else throw "now exist";
    } catch (error) {
        res.sendFile(this.DEFAULT_AVATAR);
    }
}

exports.getUserCoverImage = async (req, res) => {
    const userId = req.params.userid;
    try {
        const user = await User.findOne({ _id: userId })
        if ( user ) {
            const filePath = path.join(process.env.APP_BASE_URL, `uploads/cover/${user.setting.coverImage}`);
            if(existsSync(filePath)) res.sendFile(filePath);
            else throw "now exist";
        } else throw "now exist";
    } catch (error) {
        res.sendFile(this.DEFAULT_COVER);
    }
}

exports.getGiftIcon = async (req, res) => {
    const file = req.params.filename;
    try {
        const filePath = path.join(process.env.APP_BASE_URL, `uploads/gift/${file}`);
        if(existsSync(filePath)) res.sendFile(filePath);
        else throw "now exist";
    } catch (error) {
        res.sendFile(this.DEFAULT_GIFT);
    }
}

exports.setResetPasswordCode = async (req, res) => {
    const email = req.body.email.trim();
    const user = await User.findOne({ email: email });
    if( user ) {
        user.resetPassword = randomDegitalNumber(6);
        user.save();
        const sender = {
            email: 'Contact@gadelapp.com',
            name: 'Support',
        }
        const receivers = [
            {email},
        ]
        tranEmailApi
            .sendTransacEmail({
                sender,
                to: receivers,
                subject: `Gadel Password Reset ${user.resetPassword}`,
                textContent: `${user.resetPassword}`,
                htmlContent: `<h1>Code : ${user.resetPassword}</h1>`,
                params: {
                    role: 'Frontend',
                },
            })
            .then( (ret) => {
                res.status(200).json({
                    state: true
                });
            }).catch((err) => {
                if( err ) {
                    res.status(400).json({
                        state: false,
                        message: err
                    });
                }
                else {
                    res.status(200).json({
                        state: true
                    });
                }
            })
    }
    else {
        res.status(400).json({
            state: false,
            message: "Unregistered email"
        });
    }
}

exports.resetPassword = async ( req, res ) => {
    const email = req.body.email.trim();
    const password = req.body.password;
    const code = req.body.resetCode.trim();
    try {
        const user = await User.findOne({ email: email, resetPassword: code});
        if( user ) {
            user.password = bcrypt.hashSync(password, 11);
            user.save();
            res.status(200).json({
                state: true,
                message: "reset password success"
            })
        }
        else {
            res.status(400).json({
                state: false,
                message: "invalid email or reset code"
            })
        }
    }
    catch {
        res.status(400).json({
            state: false,
            message: "reset password error"
        })
    }
}

exports.sendMessage = ( req, res ) => {
    const userid = req.user._id;
    const to = req.body.to;
    const content = req.body.content;
    try {
        const msg = {
            from: userid,
            to: to,
            content: content,
            date: Date.now()
        }
        if( req.files ) {
            const file = req.files.file;
            if( file ) {
                let filename = generateRandomString(12, "letterAndnumber")
                file.mv(path.join(process.env.APP_BASE_URL, "uploads/message/" + filename));
                msg.file = filename;
                msg.oldName = file.name;
                const tp = file.mimetype;
                if( tp.indexOf("image") > -1 ) msg.fileType = "image";
                else msg.fileType = "other";
            }
        }
        let message = new Message(msg);
        message.save().then((ret) => {
            if(req.body.socketid) {
                req.io.to(req.body.socketid).emit("new-message", {...msg, _id: message._id})
            }
            res.status(200).json({
                status: true,
                message: 'success',
                data: message
            })
        }).catch((err) => {
            res.status(400).json({
                status: false,
                message: err,
                data: ''
            })
        })
    } catch (err) {
        res.status(400).json({
            status: false,
            message: err,
            data: ''
        })
    }
}

exports.getMessage = async ( req, res ) => {
    const userid = req.user._id;
    let messages = [];
    const selects = ["_id", "from", "to", "content", "readed", "date", "fileType", "oldName"];
    if( req.query.unread ) {
        messages = await Message.find({to: userid, readed: false}).select(selects);
    }
    else {
        const id = req.query.userid;
        messages = await Message.find({
            $or: [{ $and: [{from: userid, to: id}] }, { $and: [{from: id, to: userid}] }]
        }).select(selects);
    }
    res.json({
        status: true,
        data: {
            messages: messages
        },
        message: 'success'
    });
}

exports.addContact = async ( req, res ) => {
    const id = req.user._id;
    const userid = req.body.userid;
    try {
        if( userid == id ) throw "Can't add to contact your self."
        let user = await User.findOne({_id: id});
        if( user ) {
            let otherUser = await User.findOne({_id: userid});
            if( otherUser ) {
                let idx = user.contact.findIndex((item) => item.userid == userid);
                if( idx < 0 ){
                    user.contact.push({
                        userid: userid,
                        data: Date.now()
                    });
                    await user.save();
                }
                if( userid != id ) {
                    idx = otherUser.contact.findIndex((item) => item.userid == id);
                    if( idx < 0 ){
                        otherUser.contact.push({
                            userid: id,
                            data: Date.now()
                        });
                        await otherUser.save();
                    }
                }
                res.json({
                    status: true,
                    data: '',
                    message: 'success'
                })
            }
            else {
                res.json({
                    status: false,
                    data: '',
                    message: 'unknown user'
                })
            }

        }
        else {
            res.json({
                status: true,
                data: '',
                message: 'already'
            })
        }
    } catch (error) {
        res.json({
            status: false,
            message: error
        });
    }
}

exports.getContact = async ( req, res ) => {
    const userid = req.user._id;
    try {
        const users = [];
        const contact = (await User.findOne({_id: userid})).contact;
        const n = contact.length;
        for( let i = 0; i < n; i ++) {
            const userInfo = await User.findOne({_id: contact[i].userid}, ["firstname", "lastname", "username"]);

            if( userInfo ){
                let unread = await countUnreadMessage(userInfo._id, req.user._id);
                users.push({
                    firstname: userInfo.firstname,
                    lastname: userInfo.lastname,
                    username: userInfo.firstname,
                    _id: userInfo._id,
                    unread: unread
                });
            }
        }
        res.json({
            status: true,
            data: {
                contacts: users
            },
            message: "success"
        });
    } catch (err) {
        res.status(400).json({
            status: false,
            message: err
        });
    }
}

exports.socketEvent = (io, callback)  => {
    io.on("connection", (socket) => {
        console.log(`connected ${socket.id}`);

        socket.on("disconnect", () => {
            io.emit("user-disconnect", {socketid: socket.id});
            const userid = global.socketUserid[socket.id];
            if( userid ) global.socketIds[userid] = null;
            else console.log("unknown user", [socket.id, userid, global.socketIds]);
        });
        socket.on("client-test", (e) => {
            console.log("client-test", e);
        })
        socket.on("i-connected", (e) => {
            io.emit("user-connect", {
                userid: e.userid,
                socketid: socket.id
            });
        });
        socket.on("im-online", (e) => {
            global.socketIds[e.userid] = socket.id;
            global.socketUserid[socket.id] = e.userid;
            socket.to(e.to).emit("im-online", {userid: e.userid, socketid: socket.id});
        });
        callback(socket);
    });
}

const countUnreadMessage = async (from, to) => {
    try {
        let messages = await Message.find({from: from, to: to, readed: false});
        let count = messages.length;
        return count;
    } catch (error) {
        return 0;
    }
}

exports.setMassageAsRead = async (req, res) => {
    try {
        let message = await Message.findOne({_id: req.body.id, to: req.user._id});
        if( message ) {
            message.readed = true;
            message.save();
        }
        res.json({
            status: true
        });
    } catch (error) {
        res.status(400).json({
            status: false,
            message: error
        });
    }
}

exports.getMessageFile = (req, res) => {
    const id = req.params.messageid;
    Message.findOne({ _id: id }).then((message) => {
        const filePath = path.join(process.env.APP_BASE_URL, `uploads/message/${message.file}`);
        if(existsSync(filePath)) res.sendFile(filePath);
        else res.send("No file");
    }).catch((err) => {
        // const filePath = path.join(process.env.APP_BASE_URL, `public/default/male.png`);
        res.send("No file");
    })
}

exports.captureGiftPayment = async (req, res) => {
    try {
        const orderID = req.body.orderID;
        const token = req.body.token;
        const giftID = req.body.giftID;
        const userid = req.user._id;
        const response = await axios.post(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderID}/capture`, {
    
        }, {
            headers: {
                "Content-Type": "application/json",
                "PayPal-Partner-Attribution-Id": "BN-Code",
                "Authorization": `Bearer ${token}`
            }
        });
        this.addGift( userid, giftID );
        res.status(200).json( response.data );
    } catch (error) {
        res.status(400).json({
            status: false,
            message: error
        })        
    }

}

exports.captureOfficialActivatePayment = async (req, res) => {
    try {
        const orderID = req.body.orderID;
        const token = req.body.token;
        const userid = req.user._id;
        const response = await axios.post(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderID}/capture`, {
    
        }, {
            headers: {
                "Content-Type": "application/json",
                "PayPal-Partner-Attribution-Id": "BN-Code",
                "Authorization": `Bearer ${token}`
            }
        });
        const data = response.data;
        const unit = data.purchase_units[0];
        const payment = unit.payments;
        const capture = payment.captures[0];
        const amount = capture.amount;
        if( this.canActivateOfficial(amount.currency_code, amount.value) ) this.activateOfficialUser( userid );
        else throw "activate error";
        res.status(200).json( response.data );
    } catch (error) {
        res.status(400).json({
            status: false,
            message: error
        })        
    }
}


exports.getGifts = async (req, res) => {
    try {
        const user = await User.findOne( { _id: req.user._id } );
        if( user ) {
            const isOfficial = !!user.official;
            // if( isOfficial && user.officialActive == false ) throw "Please verify official";
            // if( !isOfficial && user.follows.length < this.MIN_FOLLOWS ) throw `You have follows less than ${this.MIN_FOLLOWS}`;
            const gifts = await GiftList.find({
                type: isOfficial?"Official":"Regular"
            });
            res.status(200).json( {
                status: true,
                data: {
                    gifts,
                    official: isOfficial
                }
            } );

        }
    } catch (error) {
        res.status(400).json({
            status: false,
            message: error
        })        
    }
}

exports.getUserGifts = async ( req, res ) => {
    try {
        const user = await User.findOne( {_id: req.user._id} );
        res.status(200).json({
            status: true,
            data: {
                gifts: user.gifts
            }
        })
    } catch (error) {
        res.status(400).json({
            status: false,
            message: error
        })
    }
}

exports.canActivateOfficial = (currency, amount) => {
    if( currency == "USD" && Number(amount) - 1.5 > -1E-8 ) return true;
    return false;
}

exports.activateOfficialUser = async ( userid ) => {
    try {
        const user = await User.findOne( {_id: userid } );
        if(!user) throw "Unknown user";
        user.officialActive = true;
        await user.save();
        return true;
    } catch ( err ) {
        return false;        
    }
}

exports.addGift = async ( userid, giftID ) => {
    try {
        const gift = await GiftList.findOne({ _id: giftID });
        if( !gift ) throw "No gift";
        const user = await User.findOne({ _id: userid });
        if( user ) {
            user.gifts.push({
                id: mongoose.Types.ObjectId(),
                title: gift.title,
                price: gift.price,
                icon: gift.icon
            });
            await user.save();
            return true;
        }
        else return false;
    }
    catch {
        return false;
    }
}

exports.sendGift = async ( req, res ) => {
    try {
        const fromID = req.user._id;
        const giftID = req.body.giftID;
        const postID = req.body.postID;
        const from = await User.findOne({ _id: fromID });
        const post = await Post.findOne({_id: postID});
        const toID = post.userId;
        if( fromID == toID ) throw "You can't send gift to your self!";
        const to = await User.findOne({ _id: toID });
        if( to.official && to.officialActive == false ) throw "You can't send gift because the user was not verified.";
        if( to.official == false && to.follows.length < this.MIN_FOLLOWS ) throw `You can't send gift because the user have follows less than ${this.MIN_FOLLOWS}.`;
        if( from && to && post ) {
            const idx = from.gifts.findIndex((item) => item.id == giftID);
            if( idx < 0 ) throw "Unknown gift";
            const gift = from.gifts[idx];
            from.gifts.splice( idx, 1);
            let newPrice = gift.price * (1 - this.SEND_GIFT_FEE);
            newPrice *= 100;
            newPrice = Math.round(newPrice);
            newPrice /= 100;
            const nGfift = {
                id: gift.id,
                title: gift.title,
                price: newPrice,
                post: post._id,
                icon: gift.icon
            }
            to.gifts.push(nGfift);
            const giftPost = await Post.findOne({_id: gift.post});
            if( giftPost ) {
                // const gifts = Array.from(giftPost.gifts);
                // const gifts = [...giftPost.gifts];
                const index = giftPost.gifts.findIndex(item => item.equals(nGfift.id));
                if( index < 0 ) ;
                else {
                    giftPost.gifts.splice(index, 1);
                    await giftPost.save();
                } 
            }
            post.gifts.push( gift.id );
            await from.save();
            await to.save();
            await post.save();
            return res.status(200).json({
                status: true,
                data: {}
            });
        }
        else return res.status(400).json({
            status: false,
            message: "Unknown user or post"
        });
    }
    catch(err) {
        return res.status(400).json({
            status: false,
            message: err
        });
    }
}

exports.updateUserInfo = (req, res) => {
    try {
        const userid = req.user._id;
        User.findOne( { _id: userid } ).then( user => {
            if( user ) {
                if( req.body.country ) user.country = req.body.country;
                if( req.body.information ) user.information = req.body.information;
                user.save().then((ret) => {
                    return res.status( 200 ).json({
                        status: true,
                        data: ''
                    });
                }).catch( err => {
                    return res.status( 400 ).json({
                        status: false,
                        message: err
                    })
                })
            }
        }).catch( err => {
            return res.status( 400 ).json({
                status: false,
                message: err
            })
        });
    } catch ( err ) {
        return res.status( 400 ).json({
            status: false,
            message: err
        })
    }
}

exports.getFollows = ( req, res ) => {
    try {
        const ret = [];
        const userid = req.query.userid;
        User.findOne( { _id: userid } ).then( async (user) => {
            if( user ) {
                const follows = user.follows;
                let nFollows = follows.length;
                for( let i = 0; i < nFollows; i ++ ) {
                    const f = await User.findOne( { _id: follows[i].userId } ).select(["username"]);
                    if( f ) {
                        ret.push( {
                            _id: f._id,
                            username: f.username,
                            date: follows[i].date
                        } );
                    }
                }
                return res.status( 200 ).json( {
                    status: true,
                    data: {
                        follows: ret
                    }
                })
            }
            else throw "Unknown user";
        }).catch( err => {
            return res.status( 400 ).json({
                status: false,
                message: err
            })
        })
    } catch (error) {
        return res.status( 400 ).json({
            status: false,
            message: error
        })
    }
}

exports.getNotifications = (req, res) => {
    try {
        Notification.find({receivers: req.user._id}).then(notifications => {
            return res.status( 200 ).json({
                status: true,
                data: {
                    notifications
                }
            });
        }).catch(err => {
            res.status( 400 ).json({
                status: false,
                message: err
            })
        })
        
    } catch (error) {
        res.status( 400 ).json({
            status: false,
            message: error
        })
    }
}


// const ts = [
//     {
//         title: "Infrastructure",
//         icon: "Infrastructure",
//         price: 200
//     },
//     {
//         title: "School",
//         icon: "School",
//         price: 0.80
//     },
//     {
//         title: "Political",
//         icon: "Political",
//         price: 300
//     },
//     {
//         title: "Parties",
//         icon: "Parties",
//         price: 100
//     },
//     {
//         title: "House",
//         icon: "House",
//         price: 150
//     },
//     {
//         title: "Bridge",
//         icon: "Bridge",
//         price: 30
//     },
//     {
//         title: "Police",
//         icon: "Police",
//         price: 200
//     },
// ];

// for (let i = 0; i < ts.length; i++) {
//     const element = ts[i];
//     let ite = new GiftList(element)
//     ite.save();
// }