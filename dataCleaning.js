const chatMessagesModel = require('./chatMessage');
const contactModel = require('./contacts');
const parsePhoneNumberFromString =
  require('libphonenumber-js').parsePhoneNumberFromString;
const fs = require('fs');
const path = require('path');
const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;
const populate = async () => {
  const chats = await chatMessagesModel.find();
  chats.forEach(async chat => {
    let query = {};
    const contact = await contactModel.findOne({ whatsappnumber: chat.from });
    if (chat.fromMe) {
      query = { whatsappnumber: chat.to };
      query = chat.name = contact.name;
    }
  });
};
const removeSpaces = str => {
  return str.replace(/\s+/g, '');
};
const exportToCSV = async () => {
  const contacts = await contactModel.find().lean();
  console.log(contacts.length);
  const filtered = contacts.filter(contact =>
    /lid/.test(contact.whatsappnumber || /@.us/.test(contact.whatsappnumber))
  );
  console.log(filtered.length);
  const customHeaders = filtered.map(contact => {
    const { pushname, isGroup, whatsappnumber, isMyContact, isBusiness } =
      contact;
    const formattedInternationalNumber =
      parsePhoneNumberFromString(whatsappnumber);
    if (!formattedInternationalNumber) {
      return {};
    }
    return {
      DisplayName: pushname ?? '',
      isGroup: isGroup,
      country: formattedInternationalNumber.country ?? '',
      phoneNumber: formattedInternationalNumber.formatInternational(),
      isSavedContact: isMyContact,
      isBusiness: isBusiness,
    };
  });
  console.log(customHeaders.length);
  const csvStringifier = createCsvStringifier({
    header: [
      'DisplayName',
      'phoneNumber',
      'country',
      'isGroup',
      'isSavedContact',
    ],
  });
  const csvData = csvStringifier.stringifyRecords(customHeaders);
  fs.writeFileSync(path.join(__dirname, 'contacts.csv'), csvData, 'utf8');
};
module.exports = exportToCSV;
