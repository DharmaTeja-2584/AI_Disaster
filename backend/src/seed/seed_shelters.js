const mysql = require('mysql2/promise');

const INITIAL_SHELTERS = [
  {
    id: 1,
    name: 'Central Metropolitan Arena Shelter',
    capacity: 1200,
    availableSpaces: 1050,
    location: '1201 S Figueroa St, Downtown',
  },
  {
    id: 2,
    name: 'North Valley High School Evacuation Center',
    capacity: 600,
    availableSpaces: 520,
    location: '8205 Woodman Ave, North Valley',
  },
  {
    id: 3,
    name: 'Westside Civic Recreation Pavilion',
    capacity: 450,
    availableSpaces: 80, // Near capacity (< 20%)
    location: '11338 Santa Monica Blvd, Westside',
  },
  {
    id: 4,
    name: 'Harbor Community Center Relief Facility',
    capacity: 350,
    availableSpaces: 0, // Full
    location: '1222 W 22nd St, Harbor District',
  },
  {
    id: 5,
    name: 'Eastside Youth Athletic Complex',
    capacity: 500,
    availableSpaces: 450,
    location: '2800 E 4th St, Eastside',
  },
  {
    id: 6,
    name: 'South Bay Emergency Transit Shelter',
    capacity: 300,
    availableSpaces: 280,
    location: '22100 S Vermont Ave, South Bay',
  },
];

async function seedShelters() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '2006',
    database: 'ai_disaster_response',
  });

  for (const s of INITIAL_SHELTERS) {
    await conn.execute(
      `INSERT INTO \`shelter\` (SHELTER_ID, SHELTER_NAME, CAPACITY, AVAILABLE_SPACES, LOCATION)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         SHELTER_NAME = VALUES(SHELTER_NAME),
         CAPACITY = VALUES(CAPACITY),
         AVAILABLE_SPACES = VALUES(AVAILABLE_SPACES),
         LOCATION = VALUES(LOCATION)`,
      [s.id, s.name, s.capacity, s.availableSpaces, s.location]
    );
  }

  console.log(`Seeded ${INITIAL_SHELTERS.length} shelters successfully.`);
  await conn.end();
}

seedShelters().catch(console.error);
