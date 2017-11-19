var mongoose = require('mongoose');
var TypeMemberEnum = {
    0 : "Guest",
    1 : "Normal",
    10 : "Admin",
    100: "Owner",
    1000: "System",
}
var TypeGroupEnum = {
    0: "Basic",
    1: "Primary",
    10: "Secondary",
    100: "University",
}

var StatusEnum = {
    0: "New",
    10: "Normal"
}

var GroupSchema = new mongoose.Schema(
    {
        id: { type: Number, unique: true, require: true, index: true, default: Date.now },
        name: {type: String, required: true},
        typegroup: { type: Number, require: false, default: 0, min: 0, max: 1000},
        profileImageID: { type: String, required: false, default: null, }, 
        coverImageID: {type: String, require: false, default: null,},
        dateCreated: { type: Date, required: true, default: null, },
        about: { type: String, required: false, default: "", },
        language: { type: [{code:String, text:String, isDefault:Boolean}], required: false, default: [{code:'en-US', text:'English(US)', isDefault: true}], },
        members: { type: [{id: Number, typemember: {type: Number, min: 0, max: 1000, default: 1}, isRemoved: {type: Boolean, default: false,}, dateJoin: Date}], required: false, default: [],},
        status: { type: Number, required: false, default: 0, min: 0, max: 1000 }, 
        location: {type: String, required: false, default:""},
        tags: { type: [String], required: false, },
        isDeleted: { type: Boolean, require: false, default: false, }
    }
);
function validateGroupName(name, isRequired = true) {
    if (!name) {
        return !isRequired;
    }
    var re = /^([a-zA-Z\-0-9\.\_]{1,40})$/;
    if (re.test(name)) {
        return true;
    }
    return false;
}
function validateTypeGroup(typeGroup, isRequired = false) {
    if (!typeGroup) {
        return !isRequired;
    }
    return TypeGroupEnum[typeGroup];
}
function validateTypeMember(typeMember, isRequired = false) {
    if (!typeMember) {
        return !isRequired;
    }
    return TypeMemberEnum[typeUser];
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
    if (!(validateGroupName(inputInfo.name, checkRequired))) {
        message.push("Name Invalid Format");
    }
    //------------ NOT REQUIRED ----------------
    if (!validateStringLength(inputInfo.about, 0, 200, false)) {
        message.push("About Invalid Format");
    }
    if (inputInfo.tags) {
        if (!getStringArray(inputInfo.tags)) {
            message.push("Tags Invalid Format");
        }
    }
    if (inputInfo.language) {
        if (!getArrayLanguage(inputInfo.language)) {
            message.push("Language Invalid Format");
        }
    }
    if (!validateTypeGroup(inputInfo.typegroup, false)) {
        message.push("TypeGroup Invalid Format");
    }
    if (!validateStatus(inputInfo.status, false)) {
        message.push("Status Invalid Format");
    }
    if (inputInfo.dateCreated) {
        if(!getDateCreated(inputInfo.dateCreated)) {
            message.push("DateCreated Invalid Format");
        }
    }
    return message;
}

function getTypeGroupInfo(enum_id) {
    return {enum_id: enum_id, text: TypeGroupEnum[enum_id]};
}
function getTypeMemberInfo(enum_id) {
    return {enum_id: enum_id, text: TypeMemberEnum[enum_id]};
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

function getDateCreated(dateString) {
    if (!dateString) {
        return null;
    }
    var date = new Date(dateString+ "Z");
    return isNaN(date.getDate()) ? null : date;
}

function getBasicInfo() {
    return {
        id:                 this.id,
        name:               this.name,
        typegroup:          {enum_id: this.typeuser, text: TypeGroupEnum[this.typegroup]}, 
        dateCreated:        this.dateCreated.toLocaleString(),
        about:              this.about,
        location:           this.location,
        tags:               this.tags,
        // members:         this.members,
        profileImageID:     this.profileImageID,
        coverImageID:       this.coverImageID,

    }
}
function addMember(userID, typemember) {
    if(!userID || !typemember) {
        return null;
    }
    if (!TypeMemberEnum[typemember]) {
        return null;
    }
    let member = null;
    for (let index = 0; index < this.members.length; index++) {
        member = this.members[index];
        if (member.id == userID) {
            member.typemember = typemember;
            return this;
        }
    }
    this.members.push({id: userID, typemember: typemember, isRemoved: false});
    return this;
}
function updateMember(userID, typemember) {
    if(!userID || !typemember) {
        return null;
    }
    if (!TypeMemberEnum[typemember]) {
        return null;
    }
    let member = null;
    for (let index = 0; index < this.members.length; index++) {
        member = this.members[index];
        if (member.id == userID) {
            member.typemember = typemember;
            return this;
        }
    }
    return null;
}
function addNormalUser(userID) {
    return this.addMember(userID, 1);
}
function addAdminUser(userID) {
    return this.addMember(userID, 10);
}
function addOwnerUser(userID) {
    return this.addMember(userID, 100);
}

function removeMember(userID) {
    if(!userID) {
        return null;
    }
    let member = null;
    let removeindex = -1;
    for (let index = 0; index < this.members.length; index++) {
        member = this.members[index];
        if (member.id == userID) {
            removeindex = index;
            break;
        }
    }
    if (removeindex >= 0) {
        this.members.splice(removeindex, 1);
        return this;
    }
    return null;
}
/*-------------------------------------- */
GroupSchema.statics.getTypeMemberInfo = getTypeMemberInfo;
GroupSchema.statics.TypeGroupInfo = getTypeGroupInfo;
GroupSchema.statics.validateGroupName = validateGroupName;
GroupSchema.statics.validateTypeMember = validateTypeMember;
GroupSchema.statics.validateTypeGroup = validateTypeGroup;
GroupSchema.statics.validateStatus = validateStatus;
GroupSchema.statics.validateInputInfo = validateInputInfo;
GroupSchema.statics.getStringArray = getStringArray;
GroupSchema.statics.getArrayLanguage = getArrayLanguage;
GroupSchema.statics.getDateCreated = getDateCreated;
GroupSchema.methods.getBasicInfo = getBasicInfo;

GroupSchema.methods.addNormalUser = addNormalUser;
GroupSchema.methods.addAdminUser = addAdminUser;
GroupSchema.methods.addOwnerUser = addOwnerUser;
GroupSchema.methods.addMember = addMember;
GroupSchema.methods.removeMember = removeMember;
GroupSchema.methods.updateMember = updateMember;

module.exports = mongoose.model('Group', GroupSchema); 