const mongoose = require('mongoose');
const Task = require('../models/schemas.js').Task;

// Utility: Process API parameters (where, sort, select, skip, limit, count).
async function process_request(request, query) {
  query.select({ __v: 0 }); // hide "__v" (version number)
  if (request['where']) { query.where(JSON.parse(request['where'])); }
  if (request['sort']) { query.sort(JSON.parse(request['sort'])); }
  //if (request['select']) { query.select(JSON.parse(request['select'])); }
  if (request['skip']) { query.skip(JSON.parse(request['skip'])); }
  if (request['limit']) { query.limit(JSON.parse(request['limit'])); }
  else { query.limit(100); } // limit to 100 results by default for tasks
  if (request['count'] && JSON.parse(request['count']) == true) { return { count: await query.countDocuments() }; }
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
      if (error instanceof SyntaxError) {
        // invalid GET (JSON) data
        res.status(400).json({ message: 'ERROR', data: {errors: ['Failed to parse JSON data.']} });
      } else {
        // something else
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
        res.status(201).json({ message: 'OK', data: {_id: savedTask._id, name: savedTask.name, email: savedTask.email, pendingTasks: savedTask.pendingTasks, dateCreated: savedTask.dateCreated} });
      });
    } catch (error) {
      if (error instanceof mongoose.Error.ValidationError) {
        // invalid POST (schema) data
        const errors = Object.values(error.errors).map(err => err.message);
        res.status(400).json({ message: 'ERROR', data: { errors: errors } });
      } else {
        // something else
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
      query.select({ __v: 0 }); // hide "__v" (version number)
      if (req.query['select']) { query.select(JSON.parse(req.query['select'])); }
      const result = await query.exec();
      if (result == null) { throw new mongoose.Error.DocumentNotFoundError('Task was not found.'); }
      res.status(200).json({ message: 'OK', data: result });
    } catch (error) {
      if (error instanceof TypeError) {
        res.status(404).json({ message: 'NONE', data: {errors: [error.message]} });
      } else if (error instanceof mongoose.Error.CastError) {
        res.status(404).json({ message: 'NONE', data: {errors: ['Task was not found. - (invalid \'id\' parameter)']} });
      } else if (error instanceof mongoose.Error.DocumentNotFoundError) {
        res.status(404).json({ message: 'NONE', data: { errors: ['Task was not found.'] } }); // errors: [error.message]
      } else if (error instanceof SyntaxError) {
        // invalid GET (JSON) data
        res.status(400).json({ message: 'ERROR', data: {errors: ['Failed to parse JSON data.']} });
      } else {
        // something else
        res.status(500).json({ message: 'ERROR', data: {errors: ['An unexpected internal error has occurred. Please retry your request later.']} });
      }
    }
  });

  // Replace entire task with supplied task or 404 error.
  tasksIdRoute.put(async function (req, res) {
    var connectionString = process.env.TOKEN;
    res.json({ message: 'My connection string is ' + connectionString });
  });

  // Delete specified task or 404 error.
  tasksIdRoute.delete(async function (req, res) {
    var connectionString = process.env.TOKEN;
    res.json({ message: 'My connection string is ' + connectionString });
  });


  return router;
}
