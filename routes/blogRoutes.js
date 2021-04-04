const mongoose = require("mongoose");
const requireLogin = require("../middlewares/requireLogin");
const cleanCache = require("../middlewares/cleanCache");

const Blog = mongoose.model("Blog");

module.exports = (app) => {
  app.get("/api/blogs/:id", requireLogin, async (req, res) => {
    const blog = await Blog.findOne({
      _user: req.user.id,
      _id: req.params.id,
    });

    res.send(blog);
  });

  app.get("/api/blogs", requireLogin, async (req, res) => {
    const blogs = await Blog.find({ _user: req.user.id }).cache({
      key: req.user.id,
    });

    res.send(blogs);
  });

  //test route implemented before create custom mongoose.Query.prototype.exec function from cache.js
  app.get("/api/blogs1", requireLogin, async (req, res) => {
    const redis = require("redis");
    const redisUrl = "redis://127.0.0.1:6379";
    const client = redis.createClient(redisUrl);
    const util = require("util");

    //pass a reference to client get function to return a promise. util.promisify is a wrapper function that returns a promise

    client.get = util.promisify(client.get);

    //do we have any cached data in redis related to this query
    //we use user id as redis client key here
    const cachedBlogs = await client.get(req.user.id);

    //if yes, then respond to the request right away and return
    //we don't need a else statement here because we have a return statement inside the if statement
    if (cachedBlogs) {
      console.log("serving from cache");
      //parse the object from client
      return res.send(JSON.parse(cachedBlogs));
    }

    //if no, we need to respond to request and update our cache to store the data
    const blogs = await Blog.find({ _user: req.user.id });

    console.log("serving from mongodb");
    res.send(blogs);

    //update our cache and store the list of blogs that we just found
    //blogs is an array of objects and we have to stringify this value because client.set function accepts only strings values
    client.set(req.user.id, JSON.stringify(blogs));
  });

  app.post("/api/blogs", requireLogin, cleanCache, async (req, res) => {
    const { title, content } = req.body;

    const blog = new Blog({
      title,
      content,
      _user: req.user.id,
    });

    try {
      await blog.save();
      res.send(blog);
    } catch (err) {
      res.send(400, err);
    }
  });

  //test route with reducing API response size (see: https://yoshevski.medium.com/reducing-api-response-size-550e65331a06)
  app.get("/api/fields", (req, res) => {
    const fields = [
      {
        trackId: "AA-1234",
        reported_dt: "12/31/2019 23:59:59",
        logitude: -111.5125,
        latitude: 33.375,
      },
      {
        trackId: "BB-5678",
        reported_dt: "12/31/2019 23:59:59",
        logitude: -113.675,
        latitude: 35.875,
      },
      {
        trackId: "CC-4545",
        reported_dt: "12/31/2019 23:59:59",
        logitude: -115.575,
        latitude: 37.675,
      },
    ];

    const fields2 = {
      fields: {
        trackId: "string",
        reported_dt: "string",
        logitude: "number",
        latitude: "number",
      },
      data: [
        ["AA-1234", "12/31/2019 23:59:59", -111.5125, 33.375],
        ["BB-5678", "12/31/2019 23:59:59", -113.675, 35.875],
        ["CC-4545", "12/31/2019 23:59:59", -115.575, 37.675],
      ],
    };

    //res.send(fields);//size 522 B transferred over network, resource size: 290 B
    res.send(fields2); //size 485 B transferred over network, resource size: 254 B
  });
};

//test post blogs API
//there is no guarantee that axios is available in chromium but fetch should be
//by default fetch doesn't include cookies with requests
//(see https://cognizant.udemy.com/course/advanced-node-for-developers/learn/lecture/9647016#overview)
// fetch("/api/blogs", {
//   method: "POST",
//   credentials: "same-origin",
//   headers: {
//     "Content-Type": "application/json",
//   },
//   body: JSON.stringify({
//     title: "My Title",
//     content: "My Content",
//   }),
// });
