const mongoose = require('mongoose');
const db = require('./models');
const User = db.user;
const Role = db.role;

async function resetUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://127.0.0.1:27017/freshshare_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    console.log('Deleting all users...');
    
    const result = await User.deleteMany({});
    console.log(`Deleted ${result.deletedCount} users`);
    
    console.log('Checking roles...');
    const count = await Role.estimatedDocumentCount();
    
    if (count === 0) {
      console.log('Adding roles to database...');
      await Promise.all([
        new Role({ name: 'user' }).save(),
        new Role({ name: 'moderator' }).save(),
        new Role({ name: 'admin' }).save()
      ]);
      console.log('Added roles to database');
    } else {
      console.log(`${count} roles already exist`);
    }
    
    console.log('Database reset complete!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

resetUsers();
