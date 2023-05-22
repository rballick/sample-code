const fs = require('fs');
module.exports = {
    files: [],
    getFiles() {
        return this.files
    },
    addFile(file) {
        this.files.push(file);
    },
    addFiles() {
        if (arguments.length === 0) return;
        files = Array.isArray(arguments[0]) ? arguments[0] : Array.from(arguments);
        this.files.push(...files);
    },
    clearFiles() {
        this.files = [];
    }
}