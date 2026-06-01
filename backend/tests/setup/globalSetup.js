const { setupSchema, clearTables } = require('./testDb');

module.exports = async () => {
  await setupSchema();
  await clearTables();
};
