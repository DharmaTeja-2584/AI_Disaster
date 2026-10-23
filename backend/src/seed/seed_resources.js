const mysql = require('mysql2/promise');

const INITIAL_RESOURCES = [
  {
    id: 1,
    name: 'Advanced Trauma & Medical Kits',
    category: 'Medical',
    quantity: 150,
    availability: 'Available',
    location: 'Metro Logistics Hub',
  },
  {
    id: 2,
    name: 'Purified Water Pallets (1000L)',
    category: 'Food & Water',
    quantity: 500,
    availability: 'Available',
    location: 'Sector 4 Warehouse',
  },
  {
    id: 3,
    name: 'MRE Emergency Ration Packs',
    category: 'Food & Water',
    quantity: 350,
    availability: 'Available',
    location: 'Sector 4 Warehouse',
  },
  {
    id: 4,
    name: 'Industrial Mobile Generators (50kW)',
    category: 'Equipment',
    quantity: 18,
    availability: 'Low Stock',
    location: 'North Staging Base',
  },
  {
    id: 5,
    name: 'High-Volume Flood Extraction Pumps',
    category: 'Equipment',
    quantity: 12,
    availability: 'Low Stock',
    location: 'Riverfront Station',
  },
  {
    id: 6,
    name: 'Heavy-Duty Thermal Disaster Blankets',
    category: 'Shelter Supplies',
    quantity: 800,
    availability: 'Available',
    location: 'Downtown Depot',
  },
  {
    id: 7,
    name: 'Family Emergency Relief Tents (6-Person)',
    category: 'Shelter Supplies',
    quantity: 65,
    availability: 'Available',
    location: 'North Staging Base',
  },
  {
    id: 8,
    name: 'Hazardous Material Neutralizer Kits',
    category: 'Medical',
    quantity: 0,
    availability: 'Depleted',
    location: 'Chemical Sector Bay',
  },
  {
    id: 9,
    name: 'Thermal Imaging Search Drones',
    category: 'Equipment',
    quantity: 5,
    availability: 'Low Stock',
    location: 'Metro Logistics Hub',
  },
];

async function seedResources() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '2006',
    database: 'ai_disaster_response',
  });

  for (const r of INITIAL_RESOURCES) {
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

  console.log(`Seeded ${INITIAL_RESOURCES.length} resources successfully.`);
  await conn.end();
}

seedResources().catch(console.error);
