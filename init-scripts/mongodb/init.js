db = db.getSiblingDB('knowledge_base');

db.createUser({
  user: process.env.MONGO_INITDB_ROOT_USERNAME,
  pwd: process.env.MONGO_INITDB_ROOT_PASSWORD,
  roles: [{ role: 'readWrite', db: 'knowledge_base' }],
});

db.createCollection('document_content');
