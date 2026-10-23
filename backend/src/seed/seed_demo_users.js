const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const DEMO_USERS = [
  { name: 'Civilian User', email: 'civilian@demo.com', password: 'demo1234', role: 'civilian', phone: '555-0101' },
  { name: 'Field Responder', email: 'responder@demo.com', password: 'demo1234', role: 'responder', phone: '555-0102' },
  { name: 'Incident Commander', email: 'commander@demo.com', password: 'demo1234', role: 'commander', phone: '555-0103' },
  { name: 'System Administrator', email: 'admin@demo.com', password: 'demo1234', role: 'admin', phone: '555-0104' },
];

async function seedDemoUsers() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '2006',
    database: 'ai_disaster_response',
  });

  for (const user of DEMO_USERS) {
    const [existing] = await conn.execute('SELECT USER_ID FROM `user` WHERE LOWER(EMAIL) = LOWER(?)', [user.email]);
    const hash = await bcrypt.hash(user.password, 10);

    if (existing.length > 0) {
      await conn.execute(
        'UPDATE `user` SET USER_NAME = ?, PASSWORD = ?, ROLE = ?, PHONE = ? WHERE USER_ID = ?',
        [user.name, hash, user.role, user.phone, existing[0].USER_ID]
      );
    } else {
      const [maxRows] = await conn.query('SELECT COALESCE(MAX(USER_ID), 0) + 1 AS nextId FROM `user`');
      const nextId = maxRows[0].nextId;
      await conn.execute(
        'INSERT INTO `user` (USER_ID, USER_NAME, EMAIL, PHONE, ROLE, PASSWORD) VALUES (?, ?, ?, ?, ?, ?)',
        [nextId, user.name, user.email, user.phone, user.role, hash]
      );
    }
  }

  console.log('Demo accounts successfully seeded.');
  await conn.end();
}

seedDemoUsers().catch(console.error);
