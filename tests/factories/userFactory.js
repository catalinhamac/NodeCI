//before run this code connect mongoose to database
const mongoose = require("mongoose");
const User = mongoose.model("User");

//see https://cognizant.udemy.com/course/advanced-node-for-developers/learn/lecture/9646964#questions
module.exports = () => {
  //user model has googleId and displayName properties and in theory if we were making use of them we would want to somehow generate like random googleId and displayName and pass them to the user before saving it. But our app is not actually make use of that data right now
  return new User({}).save();
};
