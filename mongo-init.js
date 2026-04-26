// mongo-init.js
// Runs once on first container startup to create the app DB user

db = db.getSiblingDB('ajio_clone');

db.createUser({
  user: 'ajio_user',
  pwd: 'ajio_password',
  roles: [{ role: 'readWrite', db: 'ajio_clone' }],
});

print('✅ MongoDB: ajio_clone database and user created');
