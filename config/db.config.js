module.exports = {
  HOST: '127.0.0.1',
  PORT: 27017,
  DB: 'freshshare_db',
  options: {
    serverSelectionTimeoutMS: 30000,
    autoIndex: true,
    maxPoolSize: 10,
    socketTimeoutMS: 45000,
    family: 4,
  },
};
