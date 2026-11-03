module.exports = function (router) {

  const User = require('../models/schemas.js').User;
  const usersRoute = router.route('/users');
  const usersIdRoute = router.route('/users/:id');


  // Endpoint: "users"

  usersRoute.get(function (req, res) { // Respond with a List of users.
    var connectionString = process.env.TOKEN;
    res.json({ message: 'My connection string is ' + connectionString });
  });

  usersRoute.post(function (req, res) { // Create a new user. Respond with details of new user.
    var connectionString = process.env.TOKEN;
    res.json({ message: 'My connection string is ' + connectionString });
  });


  // Endpoint: "users/:id"

  usersIdRoute.get(function (req, res) { // Respond with details of specified user or 404 error.
    var connectionString = process.env.TOKEN;
    res.json({ message: 'My connection string is ' + connectionString });
  });

  usersIdRoute.put(function (req, res) { // Replace entire user with supplied user or 404 error.
    var connectionString = process.env.TOKEN;
    res.json({ message: 'My connection string is ' + connectionString });
  });

  usersIdRoute.delete(function (req, res) { // Delete specified user or 404 error.
    var connectionString = process.env.TOKEN;
    res.json({ message: 'My connection string is ' + connectionString });
  });

  return router;
}
