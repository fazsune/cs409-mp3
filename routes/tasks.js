module.exports = function (router) {

  const Task = require('../models/schemas.js').Task;
  const tasksRoute = router.route('/tasks');
  const tasksIdRoute = router.route('/tasks/:id');


  // Endpoint: "tasks"

  tasksRoute.get(function (req, res) { // Respond with a List of tasks
    var connectionString = process.env.TOKEN;
    res.json({ message: 'My connection string is ' + connectionString });
  });

  tasksRoute.post(function (req, res) { // Create a new task. Respond with details of new task.
    var connectionString = process.env.TOKEN;
    res.json({ message: 'My connection string is ' + connectionString });
  });


  // Endpoint: "tasks/:id"

  tasksIdRoute.get(function (req, res) { // Respond with details of specified task or 404 error.
    var connectionString = process.env.TOKEN;
    res.json({ message: 'My connection string is ' + connectionString });
  });

  tasksIdRoute.put(function (req, res) { // Replace entire task with supplied task or 404 error.
    var connectionString = process.env.TOKEN;
    res.json({ message: 'My connection string is ' + connectionString });
  });

  tasksIdRoute.delete(function (req, res) { // Delete specified task or 404 error.
    var connectionString = process.env.TOKEN;
    res.json({ message: 'My connection string is ' + connectionString });
  });

  return router;
}
