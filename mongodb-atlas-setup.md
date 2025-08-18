# MongoDB Atlas Setup for FreshShare

## Connection String Format
The MongoDB Atlas connection string follows this format:
```
mongodb+srv://<username>:<password>@<cluster-url>/<database>
```

## How to Update Your Configuration

1. Replace the placeholder connection string in `config-temp.js` with your actual MongoDB Atlas connection string:

```javascript
process.env.MONGODB_URI = 'mongodb+srv://YOUR_ACTUAL_USERNAME:YOUR_ACTUAL_PASSWORD@YOUR_CLUSTER_URL/FreshShareDB';
```

2. If you're using the full Express server (server.js), it will use either:
   - `MONGODB_URI` (full connection string), or
   - `MONGODB_HOST` + `MONGODB_DB` (separate host and database name)

## Testing the MongoDB Atlas Connection

You can test your MongoDB Atlas connection with this command:
```javascript
node -e "
  require('./config-temp.js');
  const mongoose = require('mongoose');
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Atlas connection successful!'))
    .catch(err => console.error('MongoDB connection error:', err));
"
```

## Connection Troubleshooting
1. Ensure your IP address is whitelisted in MongoDB Atlas
2. Verify username and password are correct
3. Check that the database name exists in your cluster
4. Ensure your MongoDB Atlas cluster is running (not paused)
