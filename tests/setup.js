//jest does not automatically look for this file called setup
//to tell jest to run the setup file, we're going to add an option object to our package.json file like this
// "jest":{
//     "setupTestFrameworkScriptFile": "./tests/setup.js"
//   }

jest.setTimeout(30003);

require("../models/User");

const mongoose = require("mongoose");
const keys = require("../config/keys");

//by default mongoose does not want to use its built in promise implementation amd it wants you to tell it what implementation of promise we should use. so we're telling mongoose to makse use of node js global promise.
mongoose.Promise = global.Promise;
//use useMongoClient: true to avoid deprecation warning
mongoose.connect(keys.mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
