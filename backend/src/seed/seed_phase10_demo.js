require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const DEMO_USERS = [
  { name: 'Civilian User', email: 'civilian@demo.com', password: 'demo1234', role: 'civilian', phone: '555-0101' },
  { name: 'Field Responder', email: 'responder@demo.com', password: 'demo1234', role: 'responder', phone: '555-0102' },
  { name: 'Incident Commander', email: 'commander@demo.com', password: 'demo1234', role: 'commander', phone: '555-0103' },
  { name: 'System Administrator', email: 'admin@demo.com', password: 'demo1234', role: 'admin', phone: '555-0104' },
];

const DEMO_TEAMS = [
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

const DEMO_RESOURCES = [
  { id: 1, name: 'Advanced Trauma & Medical Kits', category: 'Medical', quantity: 150, availability: 'Available', location: 'Metro Logistics Hub' },
  { id: 2, name: 'Purified Water Pallets (1000L)', category: 'Food & Water', quantity: 500, availability: 'Available', location: 'Sector 4 Warehouse' },
  { id: 3, name: 'MRE Emergency Ration Packs', category: 'Food & Water', quantity: 350, availability: 'Available', location: 'Sector 4 Warehouse' },
  { id: 4, name: 'Industrial Mobile Generators (50kW)', category: 'Equipment', quantity: 18, availability: 'Low Stock', location: 'North Staging Base' },
  { id: 5, name: 'High-Volume Flood Extraction Pumps', category: 'Equipment', quantity: 12, availability: 'Low Stock', location: 'Riverfront Station' },
  { id: 6, name: 'Heavy-Duty Thermal Disaster Blankets', category: 'Shelter Supplies', quantity: 800, availability: 'Available', location: 'Downtown Depot' },
  { id: 7, name: 'Family Emergency Relief Tents (6-Person)', category: 'Shelter Supplies', quantity: 65, availability: 'Available', location: 'North Staging Base' },
  { id: 8, name: 'Hazardous Material Neutralizer Kits', category: 'Medical', quantity: 0, availability: 'Depleted', location: 'Chemical Sector Bay' },
  { id: 9, name: 'Thermal Imaging Search Drones', category: 'Equipment', quantity: 5, availability: 'Low Stock', location: 'Metro Logistics Hub' },
];

const DEMO_SHELTERS = [
  { id: 1, name: 'Central Metropolitan Arena Shelter', capacity: 1200, availableSpaces: 1050, location: '1201 S Figueroa St, Downtown' },
  { id: 2, name: 'North Valley High School Evacuation Center', capacity: 600, availableSpaces: 520, location: '8205 Woodman Ave, North Valley' },
  { id: 3, name: 'Westside Civic Recreation Pavilion', capacity: 450, availableSpaces: 80, location: '11338 Santa Monica Blvd, Westside' },
  { id: 4, name: 'Harbor Community Center Relief Facility', capacity: 350, availableSpaces: 0, location: '1222 W 22nd St, Harbor District' },
  { id: 5, name: 'Eastside Youth Athletic Complex', capacity: 500, availableSpaces: 450, location: '2800 E 4th St, Eastside' },
  { id: 6, name: 'South Bay Emergency Transit Shelter', capacity: 300, availableSpaces: 280, location: '22100 S Vermont Ave, South Bay' },
];

async function seedMasterDemo() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '2006',
    database: process.env.DB_NAME || 'ai_disaster_response',
  });

  console.log('Seeding Master Demonstration Data...');

  // 1. Users
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
      await conn.execute(
        'INSERT INTO `user` (USER_ID, USER_NAME, EMAIL, PHONE, ROLE, PASSWORD) VALUES (?, ?, ?, ?, ?, ?)',
        [maxRows[0].nextId, user.name, user.email, user.phone, user.role, hash]
      );
    }
  }
  console.log('  -> 4 Demo Users verified (Admin, Commander, Responder, Civilian)');

  // 2. Response Teams
  for (const t of DEMO_TEAMS) {
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
  console.log('  -> 6 Response Teams verified with GPS coordinates');

  // 3. Resources
  for (const r of DEMO_RESOURCES) {
    await conn.execute(
      `INSERT INTO \`resource\` (RESOURCE_ID, RESOURCE_NAME, CATEGORY, QUANTITY, AVAILABILITY, LOCATION)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         RESOURCE_NAME = VALUES(RESOURCE_NAME),
         CATEGORY = VALUES(CATEGORY),
         QUANTITY = VALUES(QUANTITY),
         AVAILABILITY = VALUES(AVAILABILITY),
         LOCATION = VALUES(LOCATION)`,
      [r.id, r.name, r.category, r.quantity, r.availability, r.location]
    );
  }
  console.log('  -> 9 Operational Resources verified');

  // 4. Shelters
  for (const s of DEMO_SHELTERS) {
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
  console.log('  -> 6 Evacuation Shelters verified');

  // 5. Ensure at least one canonical Building Collapse incident exists
  const [incidents] = await conn.execute("SELECT INCIDENT_ID FROM `incident` WHERE INCIDENT_TYPE = 'Building Collapse' LIMIT 1");
  if (incidents.length === 0) {
    const [maxInc] = await conn.query('SELECT COALESCE(MAX(INCIDENT_ID), 0) + 1 AS nextId FROM `incident`');
    const incId = maxInc[0].nextId;
    await conn.execute(
      `INSERT INTO \`incident\` (INCIDENT_ID, INCIDENT_TYPE, SEVERITY, DESCRIPTION, LATITUDE, LONGITUDE, STATUS, REPORTED_TIME)
       VALUES (?, 'Building Collapse', 8, 'Major structural collapse downtown. Multiple people trapped under concrete debris. Fire and severe structural damage expanding.', 34.0522, -118.2437, 'Active', NOW())`,
      [incId]
    );

    const [maxPred] = await conn.query('SELECT COALESCE(MAX(PREDICTION_ID), 0) + 1 AS nextId FROM `ai_prediction`');
    await conn.execute(
      `INSERT INTO \`ai_prediction\` (PREDICTION_ID, INCIDENT_ID, RISK_LEVEL, CONFIDENCE, SUGGESTED_ACTION, PREDICTION_TIME)
       VALUES (?, ?, 'High', 92.50, 'Immediate Urban Search & Rescue and technical evacuation.', NOW())`,
      [maxPred[0].nextId, incId]
    );

    const [maxAlert] = await conn.query('SELECT COALESCE(MAX(ALERT_ID), 0) + 1 AS nextId FROM `alert`');
    const alertId = maxAlert[0].nextId;
    await conn.execute(
      `INSERT INTO \`alert\` (ALERT_ID, TITLE, MESSAGE, PRIORITY, ALERT_TIME)
       VALUES (?, 'CRITICAL: High Severity Building Collapse Reported', 'Incident #${incId} reported with severity 8/10. Multiple trapped casualties.', 'Critical', NOW())`,
      [alertId]
    );

    const [maxIncAlert] = await conn.query('SELECT COALESCE(MAX(INCIDENT_ALERT_ID), 0) + 1 AS nextId FROM `incident_alert`');
    await conn.execute(
      `INSERT INTO \`incident_alert\` (INCIDENT_ALERT_ID, INCIDENT_ID, ALERT_ID) VALUES (?, ?, ?)`,
      [maxIncAlert[0].nextId, incId, alertId]
    );
    console.log(`  -> Canonical Building Collapse Incident #${incId} seeded with AI Triage & Critical Alert`);
  } else {
    console.log(`  -> Existing Building Collapse Incident #${incidents[0].INCIDENT_ID} ready`);
  }

  console.log('Master Demonstration Data seeding complete.');
  await conn.end();
}

seedMasterDemo().catch(console.error);
