const mysql = require('mysql2/promise');

const INITIAL_TEAMS = [
  {
    id: 1,
    name: 'Alpha Search & Rescue Unit',
    leader: 'Capt. Marcus Vance',
    specialization: 'Urban Search & Rescue',
    availability: 'Available',
    latitude: 34.0535,
    longitude: -118.2450,
  },
  {
    id: 2,
    name: 'Metro Fire & Hazmat Strike Team',
    leader: 'Lt. Elena Rostova',
    specialization: 'Hazmat',
    availability: 'Available',
    latitude: 34.0620,
    longitude: -118.2380,
  },
  {
    id: 3,
    name: 'Swiftwater & Flood Rescue Div-1',
    leader: 'Cmdr. David Chen',
    specialization: 'Flood Rescue',
    availability: 'Available',
    latitude: 34.0410,
    longitude: -118.2580,
  },
  {
    id: 4,
    name: 'Wildland Fire Containment Bravo',
    leader: 'Capt. Thomas Walker',
    specialization: 'Wildfire Response',
    availability: 'Available',
    latitude: 34.0800,
    longitude: -118.2200,
  },
  {
    id: 5,
    name: 'Emergency Medical Triage Squad-5',
    leader: 'Dr. Rebecca Adams',
    specialization: 'Medical Response',
    availability: 'Available',
    latitude: 34.0480,
    longitude: -118.2610,
  },
  {
    id: 6,
    name: 'Heavy Technical Rescue Unit 9',
    leader: 'Chief James Miller',
    specialization: 'Technical Rescue',
    availability: 'Available',
    latitude: 34.0350,
    longitude: -118.2700,
  },
];

async function seedTeams() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '2006',
    database: 'ai_disaster_response',
  });

  for (const t of INITIAL_TEAMS) {
    await conn.execute(
      `INSERT INTO \`response_team\` (TEAM_ID, TEAM_NAME, LEADER, SPECIALIZATION, AVAILABILITY, LATITUDE, LONGITUDE)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         TEAM_NAME = VALUES(TEAM_NAME),
         LEADER = VALUES(LEADER),
         SPECIALIZATION = VALUES(SPECIALIZATION),
         AVAILABILITY = VALUES(AVAILABILITY),
         LATITUDE = VALUES(LATITUDE),
         LONGITUDE = VALUES(LONGITUDE)`,
      [t.id, t.name, t.leader, t.specialization, t.availability, t.latitude, t.longitude]
    );
  }

  console.log(`Seeded ${INITIAL_TEAMS.length} response teams with coordinates.`);
  await conn.end();
}

seedTeams().catch(console.error);
