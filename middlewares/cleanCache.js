//ussualy middleware will run before req handler
//in our case we want to clear cache after the user created a new blog post
//we need to find a way to allow the request hadler to run first and then run the middleware
//the way that express is wired up it does not allow us to easily insert additional middleware after req handler
//adding third argument "next" to the req handler an call next inside it will not resolve the problem
//to resolve this problem, we can use async await inside middleware
const { clearHash } = require("../services/cache");

module.exports = async (req, res, next) => {
  //wait for req handler to be called
  //alow route hanlder to run first
  await next();
  //after the req handler is complete execution we can do our work
  clearHash(req.user.id);
};
