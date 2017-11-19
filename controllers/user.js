var User = require('../models/user');
async function getUserByID(id) {
    if (!id) {
        return null;
    }
    let _id = Number(id);
    if (_id) {
        return await User.findOne({
            id: id,
        });
    } else {
        return null;
    }
}
async function getUserByUserName(username) {
    if (!(User.validateUserName(username, true))) {
        return null;
    }
    return await User.findOne({
        username: username,
    });
}
async function getUserByPhone(phone) {
    if (!(User.validatePhoneNumber(phone, true))) {
        return null;
    }
    return await User.findOne({
        phone: phone,
    });
}
async function getUserbyEmail(email) {
    if (!(User.validateEmail(email, true))) {
        return null;
    }
    return await User.findOne({
        email: email,
    });
}
async function getUserByIDOrUserName(info) {
    if (!info) {
        return null;
    }  
    let _id = Number(info);
    if (_id) {
        return await User.findOne({
            $or: [{
                    id: _id
                },
                {
                    username: info
                },
            ],
        });
    } else {
        return getUserByUserName(info);
    }
}
async function getUserByUniqueInfo(info, arrays = null) {
    if (!info) {
        return null;
    }
    let user = null;
    if (!arrays) {
        user = await getUserByPhone(info);
        if (!user) {
            user = await getUserbyEmail(info);
        }
        return user;
    }
    for (let index = 0; index < arrays.length; index) {
        switch (arrays[index]) {
            case 'id|username':
                user = await getUserByIDOrUserName(info);
                break;
            case 'id':
                user = await getUserByID(info);
                break;
            case 'username':
                user = await getUserByUserName(info);
                break;
            case 'phone':
                user = await getUserByPhone(info);
                break;
            case 'email':
                user = await getUserbyEmail(info);
                break;
        }
        if (user) {
            return user;
        }
    }
    return user;
}
async function getUserByInfo(arrays, ...infos) {
    if (!infos || infos.length <= 0) {
        return null;
    }
    let user = null;
    for (let index = 0; index < infos.length; index++) {
        if (!infos[index]) {
            continue;
        }
        user = await getUserByUniqueInfo(infos[index]);
        if (user) {
            return user;
        }
    }
    return user;
}
async function findUser(req, isFindWithPhoneAndEmail = true) { //signed_in->request_userID->request_username->body_param[id>username>phone>email]
    let userFind = null;
    if (req.users.user_request) {
        return req.users.user_request;
    }
    if (req.params.userID) {
        userFind = await getUserByIDOrUserName(req.params.userID);
        if (userFind) {
            return userFind;
        }
    }
    if (req.params.username) {
        userFind = await getUserByUserName(req.params.username);
        if (userFind) {
            return userFind;
        }
    }
    if (req.body.userID) {
        userFind = await getUserByID(req.body.userID);
        if (userFind) {
            return userFind;
        }
    }
    if (req.body.id) {
        userFind = await getUserByID(req.body.id);
        if (userFind) {
            return userFind;
        }
    }
    if (req.body.username) {
        userFind = await getUserByUserName(req.body.username);
        if (userFind) {
            return userFind;
        }
    }
    if (!isFindWithPhoneAndEmail) {
        return null;
    }
    if (req.body.phone) {
        userFind = await getUserByPhone(req.body.phone)
        if (userFind) {
            return userFind;
        }
    }
    if (req.body.email) {
        userFind = await getUserbyEmail(req.body.email);
        if (userFind) {
            return userFind;
        }
    }
    return null;
}

async function updateUserInfo(req, user, isCheckValidInput = true) {
    let message = [];
    if (isCheckValidInput) {
        message = User.validateInputInfo(req.body, true);
        if (!message || message.length > 0) {
            return message;
        }
    }
    if (req.body.email) {
        if (req.body.email != user.email) {
            let checkUser = await getUserbyEmail(req.body.email);
            if (checkUser) {
                message.push('Email used.');
                return message;
            }
            user.email = req.body.email;
        }
    }
    if (req.body.phone) {
        if (req.body.phone != user.phone) {
            if (await getUserByPhone(req.body.phone)) {
                message.push('Phone used.');
                return message;
            }
            user.phone = req.body.phone;
        }
    }
    if (req.body.lastName) {
        user.lastName = req.body.lastName;
    }
    if (req.body.firstName) {
        user.firstName = req.body.firstName;
    }
    if (req.body.birthday) {
        user.birthday = User.getBirthDate(req.body.birthday);
    }
    if (req.body.gender) {
        user.gender = req.body.gender;
    }
    if (req.body.about) {
        user.about = req.body.about;
    }
    if (req.body.quote) {
        user.quote = req.body.quote;
    }
    if (req.body.nickname) {
        user.nickname = User.getStringArray(req.body.nickname);
    }
    if (req.body.language) {
        user.language = User.getArrayLanguage(req.body.language);
    }
    if (req.body.location) {
        user.location = req.body.location;
    }
    if (req.body.typeuser) {
        user.typeuser = req.body.typeuser;
    }
    return message;
}
async function postUser(req, res, next) {
    try {
        req.users.user_request = null;
        let message = User.validateInputInfo(req.body, true);
        if (!message || message.length > 0) {
            return res.status(400).send({
                code: 400,
                message: message,
                data: null,
                error: 'Request Invalid'
            });
        }
        let userFind = await findUser(req);
        if (userFind) {
            return res.status(400).send({
                code: 400,
                message: 'Username/Email/Phone exited',
                data: null
            });
        }
        let user = new User({
            // id: User.getNewID(),
            username: req.body.username,
            password: req.body.password,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            isDeleted: false,
        });
        message = await updateUserInfo(req, user, false);
        if (!message || message.length > 0) {
            return res.status(400).send({
                code: 400,
                message: message,
                data: null,
                error: 'Request Invalid',
            });
        }
        user = await user.save();
        req.users.user_request = user;
        next();
    } catch (error) {
        return res.status(500).send({
            code: 500,
            message: 'Server Error',
            data: null,
            error: error.message
        });
    }
};
async function putUser(req, res, next) {
    try {
        let message = User.validateInputInfo(req.body, false);
        if (!message || message.length > 0) {
            return res.status(400).send({
                code: 400,
                message: message,
                data: null,
                error: "Request Invalid",
            });
        }
        let user = await findUser(req, false);
        req.users.user_request = user;
        if (!user || user.isDeleted) {
            return res.status(400).send({
                code: 400,
                message: 'User Not Existed',
                data: null,
            });
        }
        message = await updateUserInfo(req, user, false);
        if (!message || message.length > 0) {
            return res.status(400).send({
                code: 400,
                message: message,
                data: null,
                error: 'Request Invalid',
            });
        }
        user = await user.save();
        req.users.user_request = user;
        next();
    } catch (error) {
        return res.status(500).send({
            code: 500,
            message: 'Server Error',
            data: null,
            error: error.message
        });
    }
}
async function deleteUser(req, res, next) {
    try {
        let user = await findUser(req);
        req.users.user_request = user;
        if (!user) {
            return res.status(400).send({
                code: 400,
                message: 'User Not Existed',
                data: null
            });
        }
        if (user.isDeleted) {
            return res.status(400).send({
                code: 400,
                message: 'User deleted.',
                data: null
            });
        } else {
            user.isDeleted = true;
            user = await user.save();
            req.users.user_request = user;
        }
        return next();
    } catch (error) {
        return res.status(500).send({
            code: 500,
            message: 'Server Error[DeleteUser]',
            data: null,
            error: error.message
        });
    };
}
async function getUser(req, res, next) {
    try {
        let user = await findUser(req);
        req.users.user_request = user;
        if (!user) {
            return res.status(400).send({
                code: 400,
                message: 'Not exit user',
                data: null
            });
        }
        if (user.isDeleted) {
            return res.status(400).send({
                code: 400,
                message: 'User Deleted',
                data: {
                    id: user.id,
                    username: user.username
                }
            });
        }
        return res.send({
            code: 200,
            message: 'Success',
            data: user.getBasicInfo()
        });
    } catch (error) {
        return res.status(500).send({
            code: 500,
            message: 'Server Error',
            data: null,
            error: error.message
        });
    }
}
async function getProfileImageID(req, res, next) {
    req.files.file_selected_id = req.users.user_request ? req.users.user_request.profileImageID : null;
    return next();
}
async function putProfileImage(req, res) {
    try {
        if (!req.files.file_saved) {
            throw new Error("Upload file Error");
        }
        let user = await findUser(req);
        if (!user || user.isDeleted) {
            return res.status(400).send({
                code: 400,
                message: 'Not exit user',
                data: null
            });
        }
        user.profileImageID = String(req.files.file_saved._id);
        user = await user.save();
        return res.json({
            code: 200,
            message: 'Success',
            data: req.files.file_saved.getBasicInfo(),
        });
    } catch (error) {
        return res.status(500).send({
            code: 500,
            message: 'Server Error',
            data: null,
            error: error.message
        });
    }
}
async function getCoverImageID(req, res, next) {
    req.files.file_selected_id = req.users.user_request ? req.users.user_request.coverImageID : null;
    next();
}
async function putCoverImage(req, res) {
    try {
        if (!req.files.file_saved) {
            throw new Error("Upload file Error");
        }
        let user = await findUser(req);
        if (!user || user.isDeleted) {
            return res.status(400).send({
                code: 400,
                message: 'Not exit user',
                data: null
            });
        }
        user.coverImageID = String(req.files.file_saved._id);
        user = await user.save();
        return res.json({
            code: 200,
            message: 'Success',
            data: req.files.file_saved.getBasicInfo(),
        });
    } catch (error) {
        return res.status(500).send({
            code: 500,
            message: 'Server Error',
            data: null,
            error: error.message
        });
    }
}
async function getFriends(req, res) {
    try {
        let user = await findUser(req);
        if (!user || user.isDeleted) {
            return res.status(400).send({
                code: 400,
                message: 'Not exit user',
                data: null
            });
        }
        return res.send({
            code: 200,
            message: 'Success',
            data: user.friends,
        })
    } catch (error) {
        return res.status(500).send({
            code: 500,
            message: 'Server Error',
            data: null,
            error: error.message
        });
    }
}

async function getClasss(req, res) {
    try {
        let user = await findUser(req);
        if (!user || user.isDeleted) {
            return res.status(400).send({
                code: 400,
                message: 'Not exit user',
                data: null
            });
        }
        return res.send({
            code: 200,
            message: '',
            data: user.classs,
        })
    } catch (error) {
        return res.status(500).send({
            code: 500,
            message: 'Server Error',
            data: null,
            error: error.message
        });
    }
}
async function checkUserNameRequest(req, res, next) {
    let user = await findUser(req);
    if (user && !user.isDeleted) {
        req.users.user_request = user;
        return next();
    } else {
        req.users.user_request = null;
        return res.status(400).send({
            status: 400,
            message: 'User not exited or deleted',
            data: null
        });
    }
    // throw new Error('Not exited has username or id.');
}
async function checkUserName(req, res) {
    try {
        let username = req.query.username ? req.query.username : 
                            req.params.username ? req.params.username : (req.body.username ? req.body.username : null);
        let user = await getUserByUserName(username);
        return res.status(user ? 200 : 400).end();
    } catch (error) {
        return res.status(500).end();
    }
}
async function checkEmail(req, res) {
    try {
        let email = req.query.email ? req.query.email : req.params.email;
        let user = await getUserbyEmail(email);
        return res.status(user ? 200 : 400).end();
    } catch (error) {
        return res.status(500).end();
    }
}
async function checkPhoneNumber(req, res) {
    try {
        let phone = req.query.phone ? req.query.phone : req.params.phone;
        let user = await getUserByPhone(phone);
        return res.status(user ? 200 : 400).end();
    } catch (error) {
        return res.status(500).end();
    }
}
async function getUsers(req, res) {
    try {
        let users = await User.find({
            isDeleted: false,
        });
        return res.json({
            code: 200,
            message: 'Success',
            count: users.length,
            // data: users.map(user => user.getBasicInfo(user))
            data: users.map(user => ({
                id: user.id,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                coverImageID: user.coverImageID,
                profileImageID: user.profileImageID,
            }))
        });
    } catch (error) {
        return res.status(500).send(error);
    }
};
/*----------------EXPORT------------------ */
exports.postUser = postUser;
exports.putUser = putUser;
exports.getUser = getUser;
exports.deleteUser = deleteUser;
exports.getFriends = getFriends;
exports.getClasss = getClasss;
exports.checkUserName = checkUserName;
exports.checkUserNameRequest = checkUserNameRequest;
exports.checkEmail = checkEmail;
exports.checkPhoneNumber = checkPhoneNumber;
exports.putProfileImage = putProfileImage;
exports.putCoverImage = putCoverImage;
exports.getProfileImageID = getProfileImageID;
exports.getCoverImageID = getCoverImageID;
exports.getUsers = getUsers;