var Application = require('./application/application');
var oauth2Controller = require('./controllers/oauth2');
var session = require('express-session');
var ejs = require('ejs');
var express = require('express');
var passport = require('passport');
var authController = require('./controllers/auth');
var bodyParser = require('body-parser');
var userController = require('./controllers/user');
var clientController = require('./controllers/client');
var groupController = require('./controllers/group');
var fileItemController = require('./controllers/fileitem');

var app = express();
var apiRouter = express.Router();
var fileRouter = express.Router();
var userRouter = express.Router();
var groupRouter = express.Router();
var checkRouter = express.Router();
var testRouter = express.Router();

var errorHanding = function (err, req, res, next) {
        if (err) {
                let status = err.status ? err.status : 500;
                let logicCode = err.logicCode ? err.logicCode : status;
                return res.status(status).send({
                        code: logicCode,
                        message: err.detail ? err.detail : err.message ? err.message : 'Server Error',
                        data: null,
                        error: err,
                })
        }
        return res.status(400).send({
                code: 400,
                message: 'Client Error',
                data: null,
                error: 'Client Error'
        });
}
Application.manager.connectToDB();
Application.manager.start();
app.set('view engine', 'ejs');
//Log request.
app.use(function (req, res, next) {
        req.files = req.files ? req.files : {};
        req.users = req.users ? req.users : {};
        req.groups = req.groups ? req.groups : {};
        console.log("Request:" + req.path + "[" + req.method + "]");
        next();
});
app.use(bodyParser.urlencoded({
        extended: true
}));
app.use(bodyParser.json());
app.use(session({
        secret: 'Super Secret Session Key',
        saveUninitialized: true,
        resave: true
}));
app.use(passport.initialize());
/*---------------------------------------------*/
apiRouter.route('/').get(function (req, res) {
        return res.json({
                message: 'API Service Running!'
        });
});
apiRouter.route('/users')
        .post(userController.postUser)
        .get(authController.isAuthenticated, userController.getUsers);
apiRouter.route('/clients')
        .post(authController.isAuthenticated, clientController.postClients)
        .get(authController.isAuthenticated, clientController.getClients);

// Create endpoint handlers for oauth2 authorize
apiRouter.route('/oauth2/authorize')
        .get(authController.isAuthenticated, oauth2Controller.authorization)
        .post(authController.isAuthenticated, oauth2Controller.decision);

// Create endpoint handlers for oauth2 token
apiRouter.route('/oauth2/token').post(authController.isClientAuthenticated, oauth2Controller.token);
/*-------------------USER_API-------------------------*/
userRouter.route('/')
        .get(userController.getUser)
        .post(userController.postUser, userController.getUser)
        .put(userController.putUser, userController.getUser)
        .delete(userController.deleteUser, userController.getUser);

userRouter.route('/:userID')
        .get(userController.getUser)
        .put(userController.putUser, userController.getUser)
        .delete(userController.deleteUser, userController.getUser);
userRouter.route('/profileImage/:userID')
        .get(userController.checkUserNameRequest,
                userController.getProfileImageID,
                fileItemController.getFile)
        .put(userController.checkUserNameRequest,
                fileItemController.profileUpload,
                fileItemController.postFile,
                userController.putProfileImage)
        .post(userController.checkUserNameRequest,
                fileItemController.profileUpload,
                fileItemController.postFile,
                userController.putProfileImage, );
userRouter.route('/coverImage/:userID')
        .get(userController.checkUserNameRequest,
                userController.getCoverImageID,
                fileItemController.getFile)
        .put(userController.checkUserNameRequest,
                fileItemController.coverUpload,
                fileItemController.postFile,
                userController.putProfileImage)
        .post(userController.checkUserNameRequest,
                fileItemController.coverUpload,
                fileItemController.postFile,
                userController.putCoverImage, );

userRouter.route('/friends/:userID')
        .get(userController.getFriends);
userRouter.route('/classs/:userID')
        .get(userController.getClasss);

userRouter.route('/files/:userID').get(fileItemController.getFiles); //TEST
/*-------------------GROUP_API-----------------------*/
groupRouter.route('/')
        .get(groupController.getGroup)
        .post(groupController.postGroup, groupController.getGroup)
        .put(groupController.putGroup, groupController.getGroup)
        .delete(groupController.deleteGroup, groupController.getGroup);
groupRouter.route('/:groupID')
        .get(groupController.getGroup)
        .put(groupController.putGroup, groupController.getGroup)
        .delete(groupController.deleteGroup, groupController.getGroup);
groupRouter.route('/profileImage/:groupID')
        .get(groupController.checkGroupRequest,
                groupController.getProfileImageID,
                fileItemController.getFile)
        .put(groupController.checkGroupRequest,
                fileItemController.profileUpload,
                fileItemController.postFile,
                groupController.putProfileImage)
        .post(groupController.checkGroupRequest,
                fileItemController.profileUpload,
                fileItemController.postFile,
                groupController.putProfileImage, );
groupRouter.route('/members/:groupID')
        .get(groupController.getMembers)
        .post(groupController.addMember, userController.getUser)
        .put(groupController.updateMember, userController.getUser)
        .delete(groupController.removeMember, userController.getUser)
groupRouter.route('/members/:groupID/:userID')
        .get(userController.getUser)
        .post(groupController.addMember, userController.getUser)
        .put(groupController.updateMember, userController.getUser)
        .delete(groupController.removeMember, userController.getUser)

groupRouter.route('/files/:groupID').get(fileItemController.getFiles); //TEST
/*-------------------FILE_API------------------------*/
fileRouter.route('/upload')
        .post(fileItemController.fileUpload,
                fileItemController.postFile,
                fileItemController.getInfoFile);
fileRouter.route('/image')
        .post(fileItemController.imageUpload,
                fileItemController.postFile,
                fileItemController.getInfoFile);
fileRouter.route('/get/:fileID')
        .get(fileItemController.getFile);
fileRouter.route('/attach/:fileID')
        .get(fileItemController.attachFile);
fileRouter.route('/delete/:fileID')
        .delete(fileItemController.deleteFile);
fileRouter.route('/info/:fileID')
        .get(fileItemController.getInfoFile);

/*----------------CHECK_API--------------------- */
checkRouter.route('/username').get(userController.checkUserName);
checkRouter.route('/username/:username').get(userController.checkUserName);
checkRouter.route('/email').get(userController.checkEmail);
checkRouter.route('/phone').get(userController.checkPhoneNumber);

/*----------------TEST_API----------------------------*/
testRouter.route('/files').get(fileItemController.getFiles);
testRouter.route('/users').get(userController.getUsers);
testRouter.route('/groups').get(groupController.getGroups);
/*------------------GROUP_ROUTER--------------------------*/
app.use('/apis', apiRouter);
app.use('/files', fileRouter);
app.use('/users', userRouter);
app.use('/groups/', groupRouter);
app.use('/checks/', checkRouter);
app.use('/test', testRouter);

app.use('/', (req, res) => res.end('Education Social NetWork Service. Not support path'));//handing error request path
app.use(errorHanding);//main error handding
app.listen(Application.manager.portRunning);
console.log('Running at ' + Application.manager.portRunning);