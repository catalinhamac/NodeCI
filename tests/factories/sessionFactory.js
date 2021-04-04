const Buffer = require("buffer").Buffer;
const Keygrip = require("keygrip");
const keys = require("../../config/keys");
const keygrip = new Keygrip([keys.cookieKey]);

module.exports = (user) => {
  //the mongoose user model property isn't of type string, actually is of type object containing the user's ID. so user._id is an JS object (typeof user._id is object). So before we're trying to turn it into a json we have to turn that object into a string.
  const sessionObject = {
    passport: {
      user: user._id.toString(),
    },
  };
  //create session string from user id from nongo db
  //transform to a base64 string
  const session = Buffer.from(JSON.stringify(sessionObject)).toString("base64");

  //create session signature
  //we use "session=" + session string because this is what library choose to do, no technical reason for this
  const sig = keygrip.sign("session=" + session);

  return {
    session,
    sig,
  };
};
