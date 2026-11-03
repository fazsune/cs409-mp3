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
    var connectionString = process.env.TOKEN;
    res.json({ message: 'My connection string is ' + connectionString });
  });

  // Create a new task, respond with details of new task.
  tasksRoute.post(async function (req, res) {
    var connectionString = process.env.TOKEN;
    res.json({ message: 'My connection string is ' + connectionString });
  });


  // Endpoint: "tasks/:id" //

  // Respond with details of specified task or 404 error.
  tasksIdRoute.get(async function (req, res) {
    var connectionString = process.env.TOKEN;
    res.json({ message: 'My connection string is ' + connectionString });
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
