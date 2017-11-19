var dotenv = require('dotenv');
var mongoose = require('mongoose');
dotenv.config();
//TODO: config mongoose: reconnect, readState...
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('connecting', () => {
    console.log("Connecting to db...");
});
db.on('error', error => {
    console.error('Error connect to db:' + error);
    // mongoose.disconnect();
});
db.on('connected', () => {
    console.log('Connected to db.');
});
// db.on('open', () => {
//     console.log('Connection to db opened');
// });
db.on('reconnected', () => {
    console.log('Reconected to db.');
});
db.on('disconnected', () => {
    console.log('Connection to db disconnected.');
});

var firstConnectSuccess = 0;
var interval = null;
function start() {
    interval = setInterval(() => {
        if (firstConnectSuccess > 0) {
            if (interval) {
                clearInterval(interval);
            }
        } else {
            console.log("Reconnecting to DB");
            connectToDB();
        }
    }, 5000);
}
async function connectToDB() {
    try {
        // let c = "mongodb://192.168.1.17:27017/education_social_network";
        // await mongoose.connect(c, {
        await mongoose.connect(exports.connectString, {//loi khi debug -> can fix.
            useMongoClient: true,
            // server: {auto_reconnect: true}//Default reconnect in 30s.
            reconnectTries: Number.MAX_VALUE,
            reconnectInterval: 5000
        });
        firstConnectSuccess++;
        // console.log("Connection success db");
    } catch(error) {
        // console.log("Connection failed db:" + error);
        firstConnectSuccess = 0;
    }
}
//TODO: export
exports.portRunning = process.env.PORT_RUNNING || 3000;
exports.connectString = process.env.MONGODB_CONNECT_STRING || "mongodb://localhost:27017/education_social_network";
exports.connectToDB = connectToDB;
exports.start = start;