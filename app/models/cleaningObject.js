var mongoose = require("mongoose");

var cleaningObjectSchema = mongoose.Schema({
    objectName: String,
    isCleaned: Boolean,
});

module.exports = mongoose.model("cleaningObject", cleaningObjectSchema);
