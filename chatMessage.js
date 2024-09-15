const { timeStamp } = require('console');
const { mongoose } = require('mongoose');

const chatMessagesSchema = new mongoose.Schema({
  from: {
    type: String,
    required: true,
  },
  author: {
    type: String,
  },
  to: {
    type: String,
    required: false,
  },
  fromMe: {
    type: Boolean,
    required: false,
  },
  body: {
    type: String,
    required: false,
  },
  deviceType: {
    type: String,
    required: true,
  },
  messageType: {
    type: String,
    required: true,
  },
  id: {
    type: String,
    required: true,
    unique: true,
  },

  timeStamp: {
    type: Date,
    required: true,
  },
});

const chatMessagesModel = mongoose.model('chats', chatMessagesSchema);

module.exports = chatMessagesModel;
