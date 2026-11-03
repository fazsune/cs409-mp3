const mongoose = require('mongoose');
const Task = require('../models/schemas.js').Task;

module.exports = function (router) {
  const tasksRoute = router.route('/tasks');
  const tasksIdRoute = router.route('/tasks/:id');


  // Endpoint: "tasks" //

  // Respond with a List of tasks.
  tasksRoute.get(function (req, res) {
    var connectionString = process.env.TOKEN;
    res.json({ message: 'My connection string is ' + connectionString });
  });

  // Create a new task, respond with details of new task.
  tasksRoute.post(function (req, res) {
    var connectionString = process.env.TOKEN;
    res.json({ message: 'My connection string is ' + connectionString });
  });


  // Endpoint: "tasks/:id" //

  // Respond with details of specified task or 404 error.
  tasksIdRoute.get(function (req, res) {
    var connectionString = process.env.TOKEN;
    res.json({ message: 'My connection string is ' + connectionString });
  });

  // Replace entire task with supplied task or 404 error.
  tasksIdRoute.put(function (req, res) {
    var connectionString = process.env.TOKEN;
    res.json({ message: 'My connection string is ' + connectionString });
  });

  // Delete specified task or 404 error.
  tasksIdRoute.delete(function (req, res) {
    var connectionString = process.env.TOKEN;
    res.json({ message: 'My connection string is ' + connectionString });
  });


  return router;
}
