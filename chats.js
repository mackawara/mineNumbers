const { mongoose } = require('mongoose');

const chatsSchema = new mongoose.Schema({
  from: {
    type: String,
    required: true,
  },
  author: {
    type: String,
  },
  //chatName: { type: String },
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
  isGroupMessage: {
    type: Boolean,
    required: false,
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

const chatsModel = mongoose.model('chats', chatsSchema);

module.exports = chatsModel;
