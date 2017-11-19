var isLog = true;
exports.setLog = _isLog => {
    isLog = _isLog === true;
}
exports.log = content => {
    isLog ? console.log(content) : undefined;
}