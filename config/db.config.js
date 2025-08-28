module.exports = {
  HOST: process.env.MONGODB_HOST || '127.0.0.1',
  PORT: process.env.MONGODB_PORT || 27017,
  DB: process.env.MONGODB_DB || 'freshshare_db',
  options: {
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    maxPoolSize: 50,
    minPoolSize: 10,
    ssl: process.env.MONGODB_SSL === 'true',
    retryWrites: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    authSource: process.env.MONGODB_AUTH_SOURCE || 'admin',
    replicaSet: process.env.MONGODB_REPLICA_SET || null,
  },
  getUri() {
    if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
    let uri = 'mongodb://';
    if (process.env.MONGODB_USER && process.env.MONGODB_PASS) {
      uri += `${encodeURIComponent(process.env.MONGODB_USER)}:${encodeURIComponent(process.env.MONGODB_PASS)}@`;
    }
    uri += `${this.HOST}:${this.PORT}`;
    uri += `/${this.DB}`;
    const uriOptions = [];
    if (this.options.ssl) uriOptions.push('ssl=true');
    if (this.options.retryWrites) uriOptions.push('retryWrites=true');
    if (uriOptions.length > 0) uri += `?${uriOptions.join('&')}`;
    return uri;
  },
};
