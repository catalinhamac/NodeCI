const mongoose = require("mongoose");
const requireLogin = require("../middlewares/requireLogin");

const redis = require("redis");
const util = require("util");
const redisUrl = "redis://127.0.0.1:6379";
const client = redis.createClient(redisUrl);
client.hget = util.promisify(client.hget);

const Blog = mongoose.model("Blog");

const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function (options = {}) {
  this.isCached = true;
  this.hashKey = JSON.stringify(options.key || "");

  return this;
};

mongoose.Query.prototype.exec = async function () {
  if (!this.isCached) {
    return exec.apply(this, arguments);
  }

  const key = JSON.stringify(
    Object.assign({}, this.getQuery(), {
      collection: this.mongooseCollection.name,
    })
  );

  const cacheValue = await client.hget(this.hashKey, key);

  if (cacheValue) {
    const doc = JSON.parse(cacheValue);

    return Array.isArray(doc)
      ? doc.map((d) => new this.model(d))
      : new this.model();
  }

  const result = await exec.apply(this, arguments);

  client.hset(this.hashKey, key, JSON.stringify(result), "EX", 10);

  return result;
};

const clearHash = (hashKey) => {
  client.del(JSON.stringify(hashKey));
};

const cleanCache = async (req, res, next) => {
  await next();

  clearHash(req.user.id);
};

module.exports = (app) => {
  app.get("/api/blogs-test", cleanCache, async (req, res) => {
    const blogs = await Blog.find({ _user: req.user.id }).cache({
      key: req.user.id,
    });

    res.send(blogs);
  });
};
