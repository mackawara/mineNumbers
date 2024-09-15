const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('connecting db')
    const connectionString = process.env.DB_STRING;
    console.log(connectionString)
    const conn = await mongoose.connect(connectionString, {
        dbName:'capri'
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

module.exports = connectDB;
