"use strict";

// MODULES //

var spawn = require("child_process").spawn;
var path = require("path");
var _ = require("underscore");
var changeCase = require("change-case");
import loadModel from "./model";
import WordVec from "./WordVector";

// VARIABLES //

var PACKAGE_FOLDER = path.join(__dirname, "..");
var SRC_FOLDER = PACKAGE_FOLDER + "/src/";

var ns = {};

export { loadModel, WordVec };
