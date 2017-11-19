var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var GenderEnum = {
    0 : "None",
    1 : "Male",
    2 : "Female"
}
var TypeUserEnum = {
    0: "Normal",
    10: "Teacher",
    100: "System"
}

var StatusEnum = {
    0: "New",
    10: "Normal"
}

var UserSchema = new mongoose.Schema(
    {
        id: { type: Number, unique: true, require: true, index: true, default: Date.now },
        username: { type: String, unique: true, required: true, },
        password: { type: String, required: true },
        firstName: { type: String,  required: true, },
        lastName: { type: String,  required: true, },
        typeuser: { type: Number, require: false, default: 0, min: 0, max: 1000},
        email: { type: String, required: false,  default: null, unique: true},
        phone: { type: String,  required: false, default: null, unique: true},
        profileImageID: { type: String, required: false, default: null, }, 
        coverImageID: {type: String, require: false, default: null,},
        birthday: { type: Date, required: false, default: null, }, 
        gender: { type: Number,  required: false, default: 0, min: 0, max: 2},
        about: { type: String, required: false, default: "", },
        quote : { type: String, required: false, default: "", },
        nickname: { type: [String], required: false, },
        skills: { type: [{name: String, description: String}], required: false, default: [], },
        worked: { type: [{startTime:Date, endTime: Date, where: String, description: String}], required: false, default: [], },
        language: { type: [{code:String, text:String, isDefault:Boolean}], required: false, default: [{code:'en-US', text:'English(US)', isDefault: true}], },
        lifeEvent: { type: [{startTime:Date, endTime:Date, description: String}], required: false, default: [], },
        classs: { type: [{id: String, typemember: Number}], required: false, default:[], }, 
        friends: { type: [Number], required: false, default: [],},
        status: { type: Number, required: false, default: 0, min: 0, max: 1000 }, 
        location: {type: String, required: false, default:""},
        isDeleted: { type: Boolean, require: false, default: false, }
    }
);

UserSchema.pre('save', function(callback)  {
    var user = this;
    if (!user.isModified('password')) return callback();
    bcrypt.genSalt(5,  (err, salt) => {
        if (err) return callback(err);
        bcrypt.hash(user.password, salt, null, (err, hash) => {
            if (err) return callback(err);
            user.password = hash;
            callback();
        });
    });
});

function validateEmail(email, isRequired = false) {
    if (!email) {
        return !isRequired;
    }
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}
function validatePhoneNumber(phone, isRequired = false) {
    if (!phone) {
        return !isRequired;
    }
    var re = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    return re.test(phone) || re.test(Number(phone));
}
function validateUserName(username, isRequired = true) {
    if (!username) {
        return !isRequired;
    }
    var re = /^([a-zA-Z\-0-9\.\_]{1,20})$/;
    if (re.test(username)) {
        return true;
    }
    if (validateEmail(username)) {
        return true;
    }
    if (validatePhoneNumber(username)) {
        return true;
    }
    return false;
}
function validateGender(gender, isRequired = false) {
    if (!gender) {
        return !isRequired;
    }
    return GenderEnum[gender];
}
function validateTypeUser(typeUser, isRequired = false) {
    if (!typeUser) {
        return !isRequired;
    }
    return TypeUserEnum[typeUser];
}
function validateStatus(status, isRequired = false) {
    if (!status) {
        return !isRequired;
    }
    return StatusEnum[status];
}

function validateStringLength(obj, minLength = 1, maxLength = 100, isRequired = true) {
    if (typeof (obj) !== "string") {
        return !isRequired;
    }
    return obj.length >= minLength && obj.length <= maxLength;
}

function validateInputInfo(inputInfo, checkRequired = false) {
    if (!inputInfo) {
        return [];
    }
    let message = [];
    //---------- REQUIRED --------------
    if (!(validateUserName(inputInfo.username, checkRequired))) {
        message.push("UserName Invalid Format");
    }
    if (!validateStringLength(inputInfo.firstName, 2, 20, checkRequired)) {
        message.push("FirstName Invalid Format");
    }
    if (!validateStringLength(inputInfo.lastName, 2, 20, checkRequired)) {
        message.push("LastName Invalid Format");
    }
    if (!validateStringLength(inputInfo.password, 5, 20, checkRequired)) {
        message.push("Password Invalid Format");
    }
    //------------ NOT REQUIRED ----------------
    if (!validateStringLength(inputInfo.about, 0, 200, false)) {
        message.push("About Invalid Format");
    }
    if (!validateStringLength(inputInfo.quote, 0, 100, false)) {
        message.push("Quote Invalid Format");
    }
    if (inputInfo.nickname) {
        if (!getStringArray(inputInfo.nickname)) {
            message.push("NickName Invalid Format");
        }
    }
    if (inputInfo.language) {
        if (!getArrayLanguage(inputInfo.language)) {
            message.push("Language Invalid Format");
        }
    }
    if (!validateEmail(inputInfo.email, false)) {
        message.push("Email Invalid Format");
    }
    if (!validatePhoneNumber(inputInfo.phone, false)) {
        message.push("Phone Invalid Format");
    }
    if (!validateGender(inputInfo.gender, false)) {
        message.push("Gender Invalid Format");
    }
    if (!validateTypeUser(inputInfo.typeuser, false)) {
        message.push("TypeUser Invalid Format");
    }
    if (!validateStatus(inputInfo.status, false)) {
        message.push("Status Invalid Format");
    }
    if (inputInfo.birthday) {
        if(!getBirthDate(inputInfo.birthday)) {
            message.push("Birthday Invalid Format");
        }
    }
    return message;
}

function getGenderInfo(enum_id) {
    return {enum_id: enum_id, text: GenderInfo[enum_id]};
}
function getTypeUserInfo(enum_id) {
    return {enum_id: enum_id, text: TypeUserEnum[enum_id]};
}

function getStringArray(jsonContent) {
    try {
        return [...items] = JSON.parse(jsonContent);
    } catch (error) {
        return null;
    }
}

function getArrayLanguage(languageString) {
    try {
        let [...languages] = JSON.parse(languageString);
        let data = [];
        for (let index = 0; index < languages.length; index++) {
            var { code = 'en-US', text = 'English(US)'} = languages[index];
            data.push({
                code: code,
                text: text,
            });
        }
        return data;
    } catch(error) {
        return null;
    }
}

function getBirthDate(dateString) {
    if (!dateString) {
        return null;
    }
    var date = new Date(dateString+ "Z");
    return isNaN(date.getDate()) ? null : date;
}

function getNewID() {
    return new Date().getTime();
}
function verifyPassword(password, cb) {
    bcrypt.compare(password, this.password, (err, isMatch) => err ?  cb(err) : cb(null, isMatch));
};

function getBasicInfo() {
    return {
        id:             this.id,
        username:       this.username,
        firstName:      this.firstName,
        lastName:       this.lastName,
        typeuser:       {enum_id: this.typeuser, text: TypeUserEnum[this.typeuser]}, 
        email:          this.email,
        birthday:       this.birthday.toLocaleString(),
        phone:          this.phone,
        gender:         {enum_id: this.gender, text: GenderEnum[this.typeuser]},
        about:          this.about,
        quote:          this.quote,
        location:       this.location,
        nickname:       this.nickname,
        // friends:        this.friends,
        // classs:         this.classs,
        // status:         {enum_id: this.status, text: StatusEnum[this.status]},
        profileImageID: this.profileImageID,
        coverImageID:   this.coverImageID,

    }
}

/*-------------------------------------- */
UserSchema.statics.GenderInfo = getGenderInfo;
UserSchema.statics.TypeUserInfo = getTypeUserInfo;
UserSchema.statics.validateEmail = validateEmail;
UserSchema.statics.validatePhoneNumber = validatePhoneNumber;
UserSchema.statics.validateUserName = validateUserName;
UserSchema.statics.validateGender = validateGender;
UserSchema.statics.validateTypeUser = validateTypeUser;
UserSchema.statics.validateStatus = validateStatus;
UserSchema.statics.validateInputInfo = validateInputInfo;
UserSchema.statics.getStringArray = getStringArray;
UserSchema.statics.getArrayLanguage = getArrayLanguage;
UserSchema.statics.getBirthDate = getBirthDate;
UserSchema.statics.getNewID = getNewID;

UserSchema.methods.verifyPassword = verifyPassword;
UserSchema.methods.getBasicInfo = getBasicInfo;

module.exports = mongoose.model('User', UserSchema); 