var FileItem = require('../models/fileitem');
var multer = require('multer');
var fs = require('fs');
var path = require('path');
var UPLOAD_PATH = 'uploads/';
var MAX_FILE_SIZE = 1 << 26;// 64M
var MAX_IMAGE_SIZE = 1 << 23; //8M
// var storage = multer.memoryStorage();
var file_upload = multer({
    dest: UPLOAD_PATH,
    // storage: storage,
    // limits: {
    //     fileSize: 1 << 22, // 4M 
    // },
});
var image_upload = multer({
    dest: UPLOAD_PATH,
    fileFilter: function (req, file, cb) {
        if (!file.originalname.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        if (file.length > MAX_IMAGE_SIZE) { //8M
            return cb(new Error('File Large. Only support Image < 8M'), false);
        }
        cb(null, true);
    },
});

function getLocalFilePath(file) {
    if (!file) {
        return null;
    }
    return path.join(UPLOAD_PATH, file.id)
};
async function checkFileExited(file) {
    return new Promise(resolve => fs.exists(getLocalFilePath(file), exists => resolve(exists)));
}
async function checkFilesExisted(files) {
    return new Promise(resolve => {
        let promises = files.map(file => {
            return checkFileExited(file, error => reject(error)).then(exists => exists ? file : null);
        });
        let datas = [];
        Promise.all(promises).then(files => {
            files.forEach(file => {
                if (file) {
                    datas.push(file);
                }
            })
            resolve(datas);
        });
    });
}

async function findFile(req) {
    if (!req) {
        return null;
    }
    let file = req.files.file_selected;
    if (file) {
        return file;
    }
    if (req.files.file_selected_id) {
        file = await FileItem.findById(req.files.file_selected_id);
        if (file) {
            return file;
        }
    }
    if (req.params.fileID) {
        file = await FileItem.findById(req.params.fileID);
        if (file) {
            return file;
        }
    }
    if (req.body.fileID) {
        file = await FileItem.findById(req.body.fileID);
        if (file) {
            return file;
        }
    }
    return null;
}

async function postFile(req, res, next) {
    try {
        req.files.file_saved = null;
        req.files.file_selected_id = null;
        if (!req.file) {
            throw new Error("Input file null");
        }
        let file = new FileItem({
            id: req.file.filename,
            name: req.file.originalname,
            type: req.file.mimetype,
            size: req.file.size,
            createDate: Date.now(),
            isDeleted: false,
        });
        if (req.users.user_request) {
            file.userID = req.users.user_request.id;
        }
        file = await file.save();
        req.files.file_saved = file;
        req.files.file_selected_id = file ? file._id : null;
        return next();
    } catch (error) {
        return res.status(500).send({
            code: 500,
            message: 'Upload Failed',
            data: null,
            error: error.message
        });
    }
};
async function deleteFile(req, res) {
    try {
        let file = await findFile(req);
        req.files.file_selected = file;
        req.files.file_selected_id = file ? file._id : null;
        if (!file || file.isDeleted) {
            return res.status(400).send({
                code: 400,
                message: 'Not exit file',
                data: null,
                error: 'Not exit file',
            });
        }
        file.isDeleted = true;
        file = await file.save();
        req.files.file_selected = file;
        req.files.file_selected_id = file ? file._id : null;
        return res.send({
            code: 200,
            message: 'Success',
            data: file.getBasicInfo(),
        });
    } catch (error) {
        return res.status(500).send({
            code: 500,
            message: 'Not delete file',
            data: null,
            error: error.message
        });
    }
};
async function getInfoFile(req, res) {
    try {
        let  file = await findFile(req);
        req.files.file_selected = file;
        req.files.file_selected_id = file ? file._id : null;
        if (!file) {
            return res.status(400).json({
                code: 400,
                message: 'File not exited or deleted.',
                data: null
            });
        } 
        if (file.isDeleted) {
            return res.status(400).json({
                code: 400,
                message: 'File deleted.',
                data: null
            });
        } else {
            return res.json({
                code: 200,
                message: 'Success',
                data: file.getBasicInfo(file)
            });
        }
    } catch (error) {
        return res.status(400).json({
            code: 400,
            message: 'Not exit file.',
            data: null,
            error: error.message
        });
    }
};
async function getFile(req, res) {
    try {
        let file = await findFile(req);
        req.files.file_selected = file;
        req.files.file_selected_id = file ? file._id : null;
        if (!file || file.isDeleted) {
            return res.status(400).send({
                code: 400,
                message: 'Not exit file.',
                data: null
            });
        }
        let readStream = fs.createReadStream(getLocalFilePath(file));
        readStream.on("error", err => {
            return res.status(500).send({
                code: 500,
                message: 'Not exit file.',
                data: null
            });
        }).on("open", () => {
            res.setHeader('Content-Type', file.type);
            res.setHeader('Content-Length', file.size);
            res.setHeader("Content-Disposition", "filename=\"" + file.name + "\"");
            // res.setHeader("Content-Disposition", "attachment; filename=\"" + file.name + "\"");
            readStream.pipe(res);
        }).on("close", () => {
            res.end();
        });
    } catch (error) {
        return res.status(400).send({
            code: 400,
            message: 'Not exit file.',
            data: null
        });
    }
};
async function attachFile(req, res) {
    try {
        let file = await findFile(req);
        req.files.file_selected = file;
        req.files.file_selected_id = file ? file._id : null;
        if (!file || file.isDeleted) {
            return res.status(400).send({
                code: 400,
                message: 'Not exit file.',
                data: null
            });
        }
        let readStream = fs.createReadStream(getLocalFilePath(file));
        readStream.on("error", err => {
            return res.status(500).send({
                code: 500,
                message: 'Not exit file.',
                data: null
            });
        }).on("open", () => {
            res.setHeader('Content-Type', file.type);
            res.setHeader('Content-Length', file.size);
            // res.setHeader("Content-Disposition", "filename=\"" + file.name + "\"");
            res.setHeader("Content-Disposition", "attachment; filename=\"" + file.name + "\"");
            readStream.pipe(res);
        }).on("close", () => {
            res.end();
        });
    } catch (error) {
        return res.status(400).send({
            code: 400,
            message: 'Not exit file.',
            data: null
        });
    }
};
async function getFiles(req, res, next) {
    try {
        let files = await FileItem.find({
            isDeleted: false
        });
        let datas = [];
        let filesExisted = await checkFilesExisted(files);
        filesExisted.forEach(file =>
            datas.push({
                id: file._id,
                name: file.name,
                type: file.type,
                size: file.size,
                createDate: file.createDate.toLocaleString()
            }));
        res.send({
            code: 200,
            message: 'Success',
            length: datas.length,
            data: datas
        });
        return next();
    } catch (error) {
        return next(error);
    }
}

/*----------------------------------------------- */
exports.fileUpload = file_upload.single('fileUpload');
exports.imageUpload = image_upload.single('imageUpload');
exports.coverUpload = image_upload.single('coverImage');
exports.profileUpload = image_upload.single('profileImage');
exports.getFiles = getFiles;
exports.attachFile = attachFile;
exports.getFile = getFile;
exports.getInfoFile = getInfoFile;
exports.deleteFile = deleteFile;
exports.postFile = postFile;