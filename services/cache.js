const mongoose = require("mongoose");
const redis = require("redis");
const util = require("util");
const keys = require("../config/keys");

//const redisUrl = "redis://127.0.0.1:6379";
const client = redis.createClient(keys.redisUrl);
client.hget = util.promisify(client.hget);

const exec = mongoose.Query.prototype.exec;

//We don’t want to cache all queries.
//whenever someone chains model with cache function, we set useCache to true on query instance
mongoose.Query.prototype.cache = function (options = {}) {
  this.useCache = true;
  this.hashKey = JSON.stringify(options.key || "");

  return this;
};

//whenever we reference a collection with Person.find() it creates a query object(const query = Person.find()). All methods of this Person model, like find, sort etc, return the new queries, with exec method exception that execute and send the query to mongo
mongoose.Query.prototype.exec = async function () {
  //the 'this' keyword inside exec function is the current query that is executed
  //this has a property called model which is a reference to the model class that is tied to the quey that is executed

  if (!this.useCache) {
    return exec.apply(this, arguments);
  }

  const key = JSON.stringify(
    Object.assign({}, this.getQuery(), {
      collection: this.mongooseCollection.name,
    })
  );

  //see if we have a value for key in redis
  const cacheValue = await client.hget(this.hashKey, key);

  //if we do, return that
  if (cacheValue) {
    //to take the json data taht we just pulled out from redis and turn in into a document model that can be used correctly throughout our app we can call new this.model with cache value as argument. this is like calling new Blog({title: "hi"})
    //we have to take in consideration two cases for model: case when we are dealing with object (e.g., user) and the other one with array of objects (e.g., list of blog posts)
    const doc = JSON.parse(cacheValue);

    return Array.isArray(doc)
      ? doc.map((d) => new this.model(d))
      : new this.model(doc);
  }

  //otherwise, issuse the query adn store the result in redis
  //run the original exec function
  //the result is the actual document instance and that is to be expected to be returned from exec function
  const result = await exec.apply(this, arguments);

  client.hset(this.hashKey, key, JSON.stringify(result), "EX", 10);

  return result;
};

//we may end up exporting multiple function from this file so we export an object with these functions
module.exports = {
  //clearing nested hashes
  //we have to import this object including the function that is nested on it into any other file inside of our project and then call clear hash passing the key we want to delete and should clear all the data that is stored at that particular key.
  clearHash(hashKey) {
    //hashKey may accidentally be provided as an array or object and to avoid any type of error we're going to pass that hash key after stringifying it
    client.del(JSON.stringify(hashKey));
  },
};

// const m = (module.exports = exports = new Object({
//   [Symbol.for("mongoose:default")]: true,
// }));
