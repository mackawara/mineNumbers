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
  // id: { type: String },

  isWAContact: {
    type: Boolean,
    required: false,
  },
  commonGroup: { type: Array },
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
  countryCode: {
    type: String,
  },
});

const contactModel = mongoose.model('contact', contactSchema);

module.exports = contactModel;
