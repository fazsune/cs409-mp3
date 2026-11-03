const mongoose = require('mongoose');
const User = require('../models/schemas.js').User;

// utility: Process API parameters (where, sort, select, skip, limit, count)
async function process_request(request, query) {
  if (request['where']) { query.where(JSON.parse(request['where'])); }
  if (request['sort']) { query.sort(JSON.parse(request['sort'])); }
  //if (request['select']) { query.select(JSON.parse(request['select'])); }
  if (request['skip']) { query.skip(JSON.parse(request['skip'])); }
  if (request['limit']) { query.limit(JSON.parse(request['limit'])); }
  if (request['count'] && JSON.parse(request['count']) == true) { return { count: await query.countDocuments() }; }
  return await query.exec();
}

module.exports = function (router) {
  const usersRoute = router.route('/users');
  const usersIdRoute = router.route('/users/:id');


  // Endpoint: "users"

  // Respond with a List of users.
  usersRoute.get(async function (req, res) {
    try {
      const query = User.find(); // mongoose query builder
      query.collection(User.collection);
      const result = await process_request(req.query, query);
      res.status(200).json({ message: 'OK', data: result });
    } catch (error) {
      if (error instanceof SyntaxError) {
        // invalid GET (JSON) data
        res.status(400).json({ message: 'ERROR', data: {errors: ['Could not parse JSON data.']} });
      } else {
        // something else
        console.log(error);
        res.status(500).json({ message: 'ERROR', data: {errors: ['An unexpected internal error has occurred. Please retry your request later.']} });
      }
    }
  });

  // Create a new user. Respond with details of new user.
  usersRoute.post(async function (req, res) {
    try {
      const newUser = new User(req.body); // validate using mongoose
      // mongoose will commit the transaction if the async function
      // executes successfully and attempt to retry if there was retryable error.
      await User.db.transaction(async () => { // (session)
        const savedUser = await newUser.save();
        res.status(201).json({ message: 'OK', data: {_id: savedUser._id, name: savedUser.name, email: savedUser.email, pendingTasks: savedUser.pendingTasks, dateCreated: savedUser.dateCreated} });
      });
    } catch (error) {
      if (error instanceof mongoose.Error.ValidationError) {
        // invalid POST (schema) data
        const errors = Object.values(error.errors).map(err => err.message);
        res.status(400).json({ message: 'ERROR', data: { errors: errors } });
      } else if (error instanceof mongoose.mongo.MongoServerError && error.code === 11000) {
        // duplicate key
        res.status(400).json({ message: 'ERROR', data: {errors: ['\'' + Object.keys(error.errorResponse.keyValue)[0] + '\' parameter is already in use by another user']} });
      } else {
        // something else
        res.status(500).json({ message: 'ERROR', data: {errors: ['An unexpected internal error has occurred. Please retry your request later.']} });
      }
    }
  });


  // Endpoint: "users/:id"

  // Respond with details of specified user or 404 error.
  usersIdRoute.get(async function (req, res) {
    var connectionString = process.env.TOKEN;
    res.json({ message: 'My connection string is ' + connectionString });
  });

  // Replace entire user with supplied user or 404 error.
  usersIdRoute.put(async function (req, res) {
    var connectionString = process.env.TOKEN;
    res.json({ message: 'My connection string is ' + connectionString });
  });

  // Delete specified user or 404 error.
  usersIdRoute.delete(async function (req, res) {
    var connectionString = process.env.TOKEN;
    res.json({ message: 'My connection string is ' + connectionString });
  });

  return router;
}
