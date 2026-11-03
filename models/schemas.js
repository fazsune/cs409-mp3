// Load required packages
const mongoose = require('mongoose');

// https://mongoosejs.com/docs/api/schema.html


// Define our User schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: [true, '"name" parameter is required'] },
  email: { type: String, required: [true, '"email" parameter is required'], unique: true },
  pendingTasks: { type: [String], default: [] }, // The _id fields of the pending tasks that this user has.
  dateCreated: { type: Date, default: Date.now, immutable: true } // Should be set automatically by server..
});

// Define our User model
const User = mongoose.model('User', UserSchema);


// Define our Task schema
const TaskSchema = new mongoose.Schema({
  name: { type: String, required: [true, '"name" parameter is required'] },
  description: { type: String, default: '' },
  deadline: { type: Date, required: [true, '"deadline" parameter is required'] },
  completed: { type: Boolean, default: false },
  assignedUser: { type: String, default: "" }, // The _id field of the user this task is assigned to (we assume that each task can be assigned to only one user).
  assignedUserName: { type: String, default: "unassigned" }, // The name field of the user this task is assigned to.
  dateCreated: { type: Date, default: Date.now, immutable: true } // Should be set automatically by server to present date.
});

// Define our Task model
const Task = mongoose.model('Task', TaskSchema);


// Export our Mongoose models
module.exports = {
  User,
  Task
};
