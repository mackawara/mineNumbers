const { client, MessageMedia } = require('./config/wwebjs-config');
const qrcode = require('qrcode-terminal');
const mongoose = require('mongoose');
const connectDB = require('./database');
const chatsModel = require('./chatMessage');
const contactsModel = require('./contacts');
const dotenv = require('dotenv');
const chatMessagesModel = require('./chatMessage');
dotenv.config();
const timeDelay = ms => new Promise(res => setTimeout(res, ms));

// connect to mongodb before running anything on the app
const run = async () => {
  const connectionString = process.env.DB_STRING;
  await mongoose.connect(connectionString).then(result => {
    console.log(result.connection.db.collections());
    console.log('connection established');
  });

  client.initialize();

  client.on('auth_failure', msg => {
    // Fired if session restore was unsuccessful
    console.error('AUTHENTICATION FAILURE', msg);
  });

  client.on('authenticated', async session => {
    console.log(`client authenticated`);
  });

  client.on('qr', qr => {
    console.log('qr stage');
    qrcode.generate(qr, { small: true });
    console.log(qr);
  });

  client.on('ready', async () => {
    console.log('client ready');
    console.time('collectingChats');
    const chats = await client.getChats();
    console.log(
      `${chats.length} chat found, please be patient while we extract messages`
    );

    let messagesSaved = 0;
    let messages;
    const fetchmessages = chats.map(async chat => {
      let limit = 1000;
      chat.isGroup ? (limit = 45000) : (limit = 10000);
      await chat.markUnread();
      return await chat.fetchMessages({ limit });
    });
    await Promise.all(fetchmessages).then(result => {
      messages = result.flat();
      console.log(`Fetching ${messages.length}messages  done`);
    });

    let chatMessagesCount = 0;
    const saveMessagesFromChat = await messages.map(async message => {
      const { body, timestamp, fromMe, deviceType } = message;

      try {
        const type = message.type;
        console.log(`message type=${type}`);

        const id = message._data.id.id;

        const existing = await chatMessagesModel.findOne({
          id: id,
        });
        let isGroupMessage;

        if (existing || type === 'e2e_notification') {
          console.log('message exist already or e2e notification');
          return;
        }
        if (body.length > 0 && !existing) {
          console.log(`now saving message ${id}`);
          const chatEntry = new chatsModel({
            body,
            timeStamp: new Date(timestamp * 1000),
            fromMe,
            from: message._data.from.user,
            author:
              !type === 'gp' || 'gp2'
                ? message._data.from.user
                : 'not_from_group',
            id,
            isGroupMessage: type === 'gp' || type === 'gp2' ? true : false,
            to:
              type === 'gp' || 'gp2'
                ? message._data.to.user
                : message._data.id.participant,
            messageType: type,
            deviceType,
          });
          await chatEntry.save().then(result => {
            chatMessagesCount++;
            messagesSaved++;
            console.log(
              `Messages From ${result.from}  saved successfuly.\n${messagesSaved} messages saved so far.`
            );
          });
        }
      } catch (error) {
        console.log(error);
      }
    });
    await Promise.all(saveMessagesFromChat).then(() => {
      console.log('Saving messages done');
      console.timeEnd('collectingChats');
    });
    console.time('contacts');
    const contacts = await client.getContacts();
    let numberOfContacts = 0;

    const contactPromises = contacts.map(async contact => {
      // console.log(contact)
      try {
        const {
          isBlocked,
          isMyContact,
          isWAContact,
          isGroup,
          isMe,
          isBusiness,
          name,
          pushname,
        } = contact;

        const exist = await contactsModel.findOne({
          whatsappnumber: contact.id.user,
        });
        if (!exist) {
          const newContact = new contactsModel({
            isBlocked,
            isMyContact,
            isWAContact,
            isGroup,
            isMe,
            isBusiness,
            name,
            pushname,
            whatsappnumber: contact.id.user,
          });
          await newContact.save().then(result => {
            numberOfContacts++;
            console.log(
              `Contact number ${result.whatsappnumber} saved successfully. ${numberOfContacts} done`
            );
          });
        }
      } catch (error) {
        console.log(error);
      }
    });
    await Promise.all(contactPromises).then(() => {
      console.log(
        `Saving contacts now complete . ${numberOfContacts} left unsaved`
      );
      console.timeEnd('contacts');
    });
  });

  client.on('disconnected', reason => {
    console.log('Client was logged out', reason);
  });
};
run();
