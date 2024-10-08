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
    console.log(chats[0]);
    console.log(
      `${chats.length} chat found, please be patient while we extract messages`
    );

    let messages;
    const fetchmessages = chats.map(async chat => {
      let limit = 100000;
      chat.isGroup ? (limit = 450000) : (limit = 100000);
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
        let isGroupMessage = type == 'gp' || type === 'gp2' ? true : false;

        if (existing || type === 'e2e_notification' || isGroupMessage) {
          console.log(
            'message exist already or e2e notification or group message'
          );
          return;
        }
        if (body.length > 0 && !existing) {
          console.log(`now saving message ${id}`);
          const chatEntry = new chatsModel({
            body,
            timeStamp: new Date(timestamp * 1000),
            fromMe,
            //chatName: chat,
            from: message._data.from.user,
            author:
              !type === 'gp' || type === 'gp2'
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

            console.log(
              `Messages From ${result.from}  saved successfuly.\n${chatMessagesCount} messages saved so far.`
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

        const whatsappnumber = await contact.getFormattedNumber();
        // const commonGroups = await contact.getCommonGroups();
        const exist = await contactsModel.findOne({
          whatsappnumber: contact.id.user,
        });
        if (!exist) {
          const newContact = new contactsModel({
            isBlocked,
            id: contact.id.user,
            isMyContact,
            isWAContact,
            isGroup,
            // commonGroups,
            isMe,
            isBusiness,
            name,
            pushname,
            whatsappnumber,
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
      console.log(`Saving contacts now complete . ${numberOfContacts} done`);
      console.timeEnd('contacts');
    });
  });

  client.on('disconnected', reason => {
    console.log('Client was logged out', reason);
  });
};
run();
