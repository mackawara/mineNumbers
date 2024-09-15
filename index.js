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
    const chats = await client.getChats();
    console.log(
      `${chats.length} chat found, please be patient while we extract messages`
    );
    //  const groupChats= await contactsModel.find({isGroup:true})
    let messagesSaved = 0;
    let messages;
    const fetchmessages = chats.map(async chat => {
      let limit = 1000;
      chat.isGroup ? (limit = 25000) : (limit = 50);
      console.log(chat);
      return await chat.fetchMessages({ limit: 1000 });
    });
    await Promise.all(fetchmessages).then(result => {
      messages = result.flat();

      console.log(`Fetching ${messages.length}messages  done`);
    });
    // console.log(messages);

    let chatMessagesCount = 0;
    const savedMessages = await messages.map(async message => {
      const { body, timestamp, fromMe, deviceType, hasMedia, id, data, to } =
        message;
      //  console.log(body, timestamp, fromMe, deviceType, id);
      try {
        const type = message.type;
        console.log(`message type=${type}`);

        const id = message._data.id.id;

        const existing = await chatMessagesModel.findOne({
          id: id,
        });
        if (existing) {
          console.log('message exist already');
          return;
        }
        if (body.length > 0 && !existing) {
          console.log(`now saving message ${id}`);
          const chatEntry = new chatsModel({
            body,
            timeStamp: new Date(timestamp * 1000),
            fromMe,
            from: message._data.from.user,
            //author: !type === 'gp' || 'gp2' ? message._data.author.user : '',
            id,
            to:
              type === 'chat'
                ? message._data.to.user
                : message._data.id.participant,
            messageType: type,
            deviceType,
          });
          await chatEntry.save().then(result => {
            chatMessagesCount++;
            messagesSaved++;
            console.log(
              `${chatMessagesCount} messages From ${result.from}  saved successfuly.\n${messagesSaved} messages saved so far.`
            );
          });
        }
      } catch (error) {
        console.log(error);
      }
    });
    await Promise.all(savedMessages).then(() => {
      console.log('Saving messages done');
    });
    // await chatMessagesModel.deleteMany({});
    /*  // create a promise for saving each message
    let saveMessages = [];
    chats.forEach(async chat => {
      await chat.markUnread().then(async result => {
        console.log(result);
        const messages = await chat.fetchMessages();

        messages.forEach(message => {
          const { body, timestamp, fromMe, deviceType } = message;
          const type = message.type;
          const id = message._data.id.id;
          const saveMessage = async () => {
            console.log('messages');
            try {
              const existing = await chatMessagesModel.findOne({
                id: id,
              });
              if (existing) {
                console.log('message exist already');
                return;
              }
              if (body.length > 0 && !existing) {
                console.log(`now saving message ${id}`);
                const chatEntry = new chatsModel({
                  body,
                  timeStamp: new Date(timestamp * 1000),
                  fromMe,
                  from: message._data.from.user,
                  id,
                  to: message._data.to.user,
                  messageType: type,
                  deviceType,
                });
                await chatEntry.save().then(result => {
                  messageSaved++;
                  console.log(
                    `${messageSaved} messages saved so far.Message From ${result.from}  saved successfuly`
                  );
                });
              }
            } catch (error) {
              console.log(error);
            }
          };
          saveMessages.push(saveMessage());
        });
      });
    }); */
    /* await Promise.all(saveMessages).then(async result => {
      ('All messages saved successfuly');
    }); */
    /* 
      const contacts = await client.getContacts();
      const numberOfContacts = contacts.length;
      let contactCount = 0;

      const contactPromises = contacts.map(async contact => {
        contactCount++;

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
            await newContact
              .save()
              .then(result =>
                console.log(
                  `Contact number ${result.whatsappnumber} saved successfully`
                )
              );
          }
        } catch (error) {
          console.log(error);
        }
      });
      await Promise.all(contactPromises).then(() => {
        console.log('Saving contacts now complete');
      });
    }); */

    client.on('disconnected', reason => {
      console.log('Client was logged out', reason);
    });
  });
};
run();
