const { timeStamp } = require('console');
const { mongoose } = require('mongoose');

const contactSchema = new mongoose.Schema({
  pushname: {
    type: String,
    required: false,
  },

  name: {
    type: String,
    required: false,
  },
  isBusiness: {
    type: Boolean,
    required: false,
  },
  isCapri: {
    type: Boolean,
    required: false,
  },
  isGroup: {
    type: Boolean,
    required: false,
  },
  isWAContact: {
    type: Boolean,
    required: false,
  },
  isMyContact: {
    type: Boolean,
    required: false,
  },

  isBlocked: {
    type: Boolean,
    required: false,
  },
  whatsappnumber: {
    type: String,
    required: true,
    unique: true,
  },
  country: {
    type: String,
    required: true,
    unique: true,
  },
});

const contactModel = mongoose.model('contact', contactSchema);

module.exports = contactModel;
