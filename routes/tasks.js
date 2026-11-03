const mongoose = require('mongoose');
const Task = require('../models/schemas.js').Task;
const User = require('../models/schemas.js').User;

// Utility: Process API parameters (where, sort, select, skip, limit, count).
async function process_request(request, query) {
  if (request['where']) { query.where(JSON.parse(request['where'])); }
  if (request['sort']) { query.sort(JSON.parse(request['sort'])); }
  if (request['select']) { query.select(JSON.parse(request['select'])); }
  if (request['skip']) { query.skip(JSON.parse(request['skip'])); }
  if (request['limit']) { query.limit(JSON.parse(request['limit'])); }
  else { query.limit(100); } // limit to 100 results by default for tasks
  if (request['count'] && JSON.parse(request['count']) == true) { return { count: await query.countDocuments() }; }
  query.select({ __v: 0 }); // hide "__v" (version number)
  return await query.exec();
}


module.exports = function (router) {
  const tasksRoute = router.route('/tasks');
  const tasksIdRoute = router.route('/tasks/:id');


  // Endpoint: "tasks" //

  // Respond with a List of tasks.
  tasksRoute.get(async function (req, res) {
    try {
      const query = Task.find(); // mongoose query builder
      query.collection(Task.collection);
      const result = await process_request(req.query, query);
      res.status(200).json({ message: 'OK', data: result });
    } catch (error) {
      if (error instanceof SyntaxError) { // invalid GET (JSON) data
        res.status(400).json({ message: 'ERROR', data: {errors: ['Failed to parse JSON data.']} });
      } else { // something else
        res.status(500).json({ message: 'ERROR', data: {errors: ['An unexpected internal error has occurred. Please retry your request later.']} });
      }
    }
  });

  // Create a new task, respond with details of new task.
  tasksRoute.post(async function (req, res) {
    try {
      const newTask = new Task(req.body);
      await newTask.validate(); // validate using mongoose
      // mongoose will commit the transaction if the async function
      // executes successfully and attempt to retry if there was retryable error.
      await Task.db.transaction(async () => { // (session)
        const savedTask = await newTask.save();
        res.status(201).json({ message: 'OK', data: {_id: savedTask._id, name: savedTask.name, description: savedTask.description, deadline: savedTask.deadline, completed: savedTask.completed, assignedUser: savedTask.assignedUser, assignedUserName: savedTask.assignedUserName, dateCreated: savedTask.dateCreated} });
      });
    } catch (error) {
      if (error instanceof mongoose.Error.ValidationError) { // invalid POST (schema) data
        const errors = Object.values(error.errors).map(err => err.message);
        res.status(400).json({ message: 'ERROR', data: {errors: errors} });
      } else if (error instanceof TypeError) { // invalid/missing parameter
        res.status(400).json({ message: 'ERROR', data: {errors: [error.message]} });
      } else { // something else
        res.status(500).json({ message: 'ERROR', data: {errors: ['An unexpected internal error has occurred. Please retry your request later.']} });
      }
    }
  });


  // Endpoint: "tasks/:id" //

  // Respond with details of specified task or 404 error.
  tasksIdRoute.get(async function (req, res) {
    try {
      if (!('id' in req.params)) { throw new TypeError('\'id\' parameter was not found.'); }
      const taskId = req.params['id'];
      const query = Task.findById(taskId); // mongoose query builder
      query.collection(Task.collection);
      if (req.query['select']) { query.select(JSON.parse(req.query['select'])); }
      query.select({ __v: 0 }); // hide "__v" (version number)
      const result = await query.exec();
      if (result == null) { throw new mongoose.Error.DocumentNotFoundError('Task was not found.'); }
      res.status(200).json({ message: 'OK', data: result });
    } catch (error) {
      if (error instanceof mongoose.Error.CastError) { // invalid id parameter
        res.status(404).json({ message: 'NONE', data: {errors: ['Task was not found. - (invalid \'id\' parameter)']} });
      } else if (error instanceof mongoose.Error.DocumentNotFoundError) { // not found
        res.status(404).json({ message: 'NONE', data: {errors: ['Task was not found.']} }); // errors: [error.message]
      } else if (error instanceof SyntaxError) { // invalid GET (JSON) data
        res.status(400).json({ message: 'ERROR', data: {errors: ['Failed to parse JSON data.']} });
      } else if (error instanceof TypeError) { // invalid/missing parameter
        res.status(400).json({ message: 'ERROR', data: {errors: [error.message]} });
      } else { // something else
        res.status(500).json({ message: 'ERROR', data: {errors: ['An unexpected internal error has occurred. Please retry your request later.']} });
      }
    }
  });

  // Replace entire task with supplied task or 404 error.
  tasksIdRoute.put(async function (req, res) {
    try {
      if (!('id' in req.params)) { throw new TypeError('\'id\' parameter was not found.'); }
      const taskId = req.params['id'];
      // mongoose will commit the transaction if the async function
      // executes successfully and attempt to retry if there was retryable error.
      await Task.db.transaction(async () => { // (session)
        const foundTask = await Task.findOne({ _id: taskId }, null, { runValidators: true });
        if (foundTask == null) { throw new mongoose.Error.DocumentNotFoundError('Task was not found.'); }
        if (req.body['name']) { foundTask.name = req.body['name']; }
        if (req.body['description']) { foundTask.description = req.body['description']; }
        if (req.body['deadline']) { foundTask.deadline = req.body['deadline']; }
        if (req.body['completed']) { foundTask.completed = req.body['completed']; }
        if (req.body['assignedUser'] && req.body['assignedUserName']) {
          const foundUser = await User.findOne({ _id: req.body['assignedUser'], name: req.body['assignedUserName'] }, null, { runValidators: true });
          if (foundUser == null) { throw new TypeError('User that was specified with \'assignedUser\' was not found or does not match up with given \'assignedUserName\'.'); }
          else { foundTask.assignedUser = req.body['assignedUser']; foundTask.assignedUserName = req.body['assignedUserName']; }
        } else if (req.body['assignedUser']) {
          const foundUser = await User.findOne({ _id: req.body['assignedUser'] }, null, { runValidators: true });
          if (foundUser == null) { throw new TypeError('User that was specified with \'assignedUser\' was not found.'); }
          else { foundTask.assignedUser = req.body['assignedUser']; foundTask.assignedUserName = foundUser.name; }
        } else if (req.body['assignedUserName']) {
          // ignore because we don't have the user's id (multiple users can have the same name)
        }
        await foundTask.save();
        res.status(200).json({ message: 'OK', data: {_id: foundTask._id, name: foundTask.name, description: foundTask.description, deadline: foundTask.deadline, completed: foundTask.completed, assignedUser: foundTask.assignedUser, assignedUserName: foundTask.assignedUserName, dateCreated: foundTask.dateCreated} });
      });
    } catch (error) {
      if (error instanceof mongoose.Error.CastError) { // invalid id parameter
        res.status(404).json({ message: 'NONE', data: {errors: ['Task was not found. - (invalid \'id\' parameter)']} });
      } else if (error instanceof mongoose.Error.DocumentNotFoundError) { // not found
        res.status(404).json({ message: 'NONE', data: {errors: ['Task was not found.']} }); // errors: [error.message]
      } else if (error instanceof mongoose.Error.ValidationError) { // invalid POST (schema) data
        const errors = Object.values(error.errors).map(err => err.message);
        res.status(400).json({ message: 'ERROR', data: {errors: errors} });
      } else if (error instanceof TypeError) { // invalid/missing parameter
        res.status(400).json({ message: 'ERROR', data: {errors: [error.message]} });
      } else { // something else
        res.status(500).json({ message: 'ERROR', data: {errors: ['An unexpected internal error has occurred. Please retry your request later.']} });
      }
    }
  });

  // Delete specified task or 404 error.
  tasksIdRoute.delete(async function (req, res) {
    try {
      if (!('id' in req.params)) { throw new TypeError('\'id\' parameter was not found.'); }
      const taskId = req.params['id'];
      // mongoose will commit the transaction if the async function
      // executes successfully and attempt to retry if there was retryable error.
      await Task.db.transaction(async () => { // (session)
        const foundTask = await Task.findOne({ _id: taskId }, null, { runValidators: true });
        if (foundTask == null) { throw new mongoose.Error.DocumentNotFoundError('Task was not found.'); }
        await Task.deleteOne({ _id: taskId }, { runValidators: true });
        res.status(204).json({ message: 'OK', data: {} });
      });
    } catch (error) {
      if (error instanceof mongoose.Error.CastError) { // invalid id parameter
        res.status(404).json({ message: 'NONE', data: {errors: ['Task was not found. - (invalid \'id\' parameter)']} });
      } else if (error instanceof mongoose.Error.DocumentNotFoundError) { // not found
        res.status(404).json({ message: 'NONE', data: {errors: ['Task was not found.']} }); // errors: [error.message]
      } else if (error instanceof TypeError) { // invalid/missing parameter
        res.status(400).json({ message: 'ERROR', data: {errors: [error.message]} });
      } else { // something else
        res.status(500).json({ message: 'ERROR', data: {errors: ['An unexpected internal error has occurred. Please retry your request later.']} });
      }
    }
  });


  return router;
}
