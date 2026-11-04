const mongoose = require('mongoose');
const User = require('../models/schemas.js').User;

// Utility: Process API parameters (where, sort, select, skip, limit, count).
async function processRequest(request, query) {
  if (request['where']) { query.where(JSON.parse(request['where'])); }
  if (request['sort']) { query.sort(JSON.parse(request['sort'])); }
  if (request['select']) { query.select(JSON.parse(request['select'])); }
  if (request['skip']) { query.skip(JSON.parse(request['skip'])); }
  if (request['limit']) { query.limit(JSON.parse(request['limit'])); }
  if (request['count'] && JSON.parse(request['count']) == true) { return { count: await query.countDocuments() }; }
  query.select({ __v: 0 }); // hide "__v" (version number)
  return await query.exec();
}


module.exports = function (router) {
  const usersRoute = router.route('/users');
  const usersIdRoute = router.route('/users/:id');


  // Endpoint: "users" //

  // Respond with a List of users.
  usersRoute.get(async function (req, res) {
    try {
      // mongoose will commit the transaction if the async function
      // executes successfully and attempt to retry if there was retryable error
      await User.db.transaction(async () => { // (session)
        const query = User.find(); // mongoose query builder
        query.collection(User.collection);
        const result = await processRequest(req.query, query);
        res.status(200).json({ message: 'OK', data: result });
      });
    } catch (error) {
      if (error instanceof SyntaxError) { // invalid GET (JSON) data
        res.status(400).json({ message: 'ERROR', data: {errors: ['Failed to parse JSON data.']} });
      } else { // something else
        res.status(500).json({ message: 'ERROR', data: {errors: ['An unexpected internal error has occurred. Please retry your request later.']} });
      }
    }
  });

  // Create a new user, respond with details of new user.
  usersRoute.post(async function (req, res) {
    try {
      const newUser = new User(req.body);
      await newUser.validate(); // validate using mongoose
      // mongoose will commit the transaction if the async function
      // executes successfully and attempt to retry if there was retryable error
      await User.db.transaction(async () => { // (session)
        const savedUser = await newUser.save();
        res.status(201).json({ message: 'OK', data: {_id: savedUser._id, name: savedUser.name, email: savedUser.email, pendingTasks: savedUser.pendingTasks, dateCreated: savedUser.dateCreated} });
      });
    } catch (error) {
      if (error instanceof mongoose.Error.ValidationError) { // invalid POST (schema) data
        const errors = Object.values(error.errors).map(err => err.message);
        res.status(400).json({ message: 'ERROR', data: {errors: errors} });
      } else if (error instanceof mongoose.mongo.MongoServerError && error.code === 11000) { // duplicate key
        res.status(400).json({ message: 'ERROR', data: {errors: ['\'' + Object.keys(error.errorResponse.keyValue)[0] + '\' parameter is already in use by another user.']} });
      } else { // something else
        res.status(500).json({ message: 'ERROR', data: {errors: ['An unexpected internal error has occurred. Please retry your request later.']} });
      }
    }
  });


  // Endpoint: "users/:id" //

  
  // Respond with details of specified user or 404 error.
  usersIdRoute.get(async function (req, res) {
    try {
      if (!('id' in req.params)) { throw new TypeError('\'id\' parameter was not found.'); }
      const userId = req.params['id'];
      // mongoose will commit the transaction if the async function
      // executes successfully and attempt to retry if there was retryable error
      await User.db.transaction(async () => { // (session)
        const query = User.findById(userId); // mongoose query builder
        query.collection(User.collection);
        if (req.query['select']) { query.select(JSON.parse(req.query['select'])); }
        query.select({ __v: 0 }); // hide "__v" (version number)
        const result = await query.exec();
        if (result == null) { throw new mongoose.Error.DocumentNotFoundError('User was not found.'); }
        res.status(200).json({ message: 'OK', data: result });
      });
    } catch (error) {
      if (error instanceof mongoose.Error.CastError) { // invalid id parameter
        res.status(404).json({ message: 'NONE', data: {errors: ['User was not found. - (invalid \'id\' parameter)']} });
      } else if (error instanceof mongoose.Error.DocumentNotFoundError) { // not found
        res.status(404).json({ message: 'NONE', data: {errors: ['User was not found.']} }); // errors: [error.message]
      } else if (error instanceof SyntaxError) { // invalid GET (JSON) data
        res.status(400).json({ message: 'ERROR', data: {errors: ['Failed to parse JSON data.']} });
      } else if (error instanceof TypeError) { // invalid/missing parameter
        res.status(400).json({ message: 'ERROR', data: {errors: [error.message]} });
      } else { // something else
        res.status(500).json({ message: 'ERROR', data: {errors: ['An unexpected internal error has occurred. Please retry your request later.']} });
      }
    }
  });

  // Replace entire user with supplied user or 404 error.
  usersIdRoute.put(async function (req, res) {
    try {
      if (!('id' in req.params)) { throw new TypeError('\'id\' parameter was not found.'); }
      const userId = req.params['id'];
      // mongoose will commit the transaction if the async function
      // executes successfully and attempt to retry if there was retryable error
      await User.db.transaction(async () => { // (session)
        const foundUser = await User.findOne({ _id: userId }, null, { runValidators: true });
        if (foundUser == null) { throw new mongoose.Error.DocumentNotFoundError('User was not found.'); }
        if (req.body['name']) { foundUser.name = req.body['name']; }
        if (req.body['email']) { foundUser.email = req.body['email']; }
        if (req.body['pendingTasks']) { foundUser.pendingTasks = req.body['pendingTasks']; }
        await foundUser.save();
        res.status(200).json({ message: 'OK', data: {_id: foundUser._id, name: foundUser.name, email: foundUser.email, pendingTasks: foundUser.pendingTasks, dateCreated: foundUser.dateCreated} });
      });
    } catch (error) {
      if (error instanceof mongoose.Error.CastError) { // invalid id parameter
        res.status(404).json({ message: 'NONE', data: {errors: ['User was not found. - (invalid \'id\' parameter)']} });
      } else if (error instanceof mongoose.Error.DocumentNotFoundError) { // not found
        res.status(404).json({ message: 'NONE', data: {errors: ['User was not found.']} }); // errors: [error.message]
      } else if (error instanceof mongoose.Error.ValidationError) { // invalid POST (schema) data
        const errors = Object.values(error.errors).map(err => err.message);
        res.status(400).json({ message: 'ERROR', data: {errors: errors} });
      } else if (error instanceof mongoose.mongo.MongoServerError && error.code === 11000) { // duplicate key
        res.status(400).json({ message: 'ERROR', data: {errors: ['\'' + Object.keys(error.errorResponse.keyValue)[0] + '\' parameter is already in use by another user.']} });
      } else if (error instanceof TypeError) { // invalid/missing parameter
        res.status(400).json({ message: 'ERROR', data: {errors: [error.message]} });
      } else { // something else
        res.status(500).json({ message: 'ERROR', data: {errors: ['An unexpected internal error has occurred. Please retry your request later.']} });
      }
    }
  });

  // Delete specified user or 404 error.
  usersIdRoute.delete(async function (req, res) {
    try {
      if (!('id' in req.params)) { throw new TypeError('\'id\' parameter was not found.'); }
      const userId = req.params['id'];
      // mongoose will commit the transaction if the async function
      // executes successfully and attempt to retry if there was retryable error
      await User.db.transaction(async () => { // (session)
        const foundUser = await User.findOne({ _id: userId }, null, { runValidators: true });
        if (foundUser == null) { throw new mongoose.Error.DocumentNotFoundError('User was not found.'); }
        await User.deleteOne({ _id: userId }, { runValidators: true });
        res.status(204).json({ message: 'OK', data: {} });
      });
    } catch (error) {
      if (error instanceof mongoose.Error.CastError) { // invalid id parameter
        res.status(404).json({ message: 'NONE', data: {errors: ['User was not found. - (invalid \'id\' parameter)']} });
      } else if (error instanceof mongoose.Error.DocumentNotFoundError) { // not found
        res.status(404).json({ message: 'NONE', data: {errors: ['User was not found.']} }); // errors: [error.message]
      } else if (error instanceof TypeError) { // invalid/missing parameter
        res.status(400).json({ message: 'ERROR', data: {errors: [error.message]} });
      } else { // something else
        res.status(500).json({ message: 'ERROR', data: {errors: ['An unexpected internal error has occurred. Please retry your request later.']} });
      }
    }
  });


  return router;
}
