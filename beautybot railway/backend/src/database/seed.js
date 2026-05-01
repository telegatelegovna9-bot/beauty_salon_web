const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function seed() {
  console.log('🌱 Seeding database...');

  const SQL = await initSqlJs();
  const DB_PATH = process.env.DB_PATH || './data/beauty_salon.db';

  const dbBuffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(dbBuffer);

  // Check if services already exist
  const count = db.prepare('SELECT COUNT(*) as c FROM services').get();
  if (count.c > 0) {
    console.log('⏭️  Services already exist, skipping seed');
    db.close();
    return;
  }

  const insertService = db.prepare(`
    INSERT INTO services (name, description, category, duration_minutes, price, price_max, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const services = [
    ['Классический маникюр', 'Обработка ногтей, кутикулы и покрытие лаком', 'manicure', 60, 1200, null, 1],
    ['Аппаратный маникюр', 'Маникюр с использованием аппарата', 'manicure', 75, 1500, null, 2],
    ['Маникюр с гель-лаком', 'Покрытие гель-лаком с долгосрочным эффектом', 'manicure', 90, 2000, 2500, 3],
    ['Наращивание ногтей', 'Наращивание на типсы или формы', 'manicure', 150, 3500, 4500, 4],
    ['Дизайн ногтей', 'Художественный дизайн, стразы, фольга', 'manicure', 30, 500, 1500, 5],
    ['Классический педикюр', 'Обработка стоп и ногтей', 'pedicure', 90, 1800, null, 6],
    ['Аппаратный педикюр', 'Педикюр с использованием аппарата', 'pedicure', 90, 2000, null, 7],
    ['Педикюр с гель-лаком', 'Покрытие гель-лаком на ногти ног', 'pedicure', 120, 2500, 3000, 8],
    ['SPA-педикюр', 'Расслабляющий педикюр с ванночкой и маской', 'pedicure', 120, 3000, null, 9],
    ['Коррекция бровей', 'Придание формы бровям', 'eyebrows', 30, 800, null, 10],
    ['Окрашивание бровей', 'Окрашивание хной или краской', 'eyebrows', 45, 1000, null, 11],
    ['Ламинирование бровей', 'Долгосрочная укладка бровей', 'eyebrows', 60, 2500, null, 12],
    ['Архитектура бровей', 'Полная работа с формой и цветом', 'eyebrows', 90, 3000, null, 13],
    ['Классическое наращивание ресниц', 'Наращивание 1:1', 'eyelashes', 120, 3000, null, 14],
    ['2D/3D наращивание ресниц', 'Объёмное наращивание', 'eyelashes', 150, 4000, 5000, 15],
    ['Ламинирование ресниц', 'Долгосрочный завиток ресниц', 'eyelashes', 90, 2500, null, 16],
    ['Коррекция ресниц', 'Заполнение выпавших ресниц', 'eyelashes', 90, 2000, null, 17],
  ];

  const seedTx = db.transaction(() => {
    services.forEach(s => insertService.run(...s));
  });
  seedTx();

  // Save database to disk
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
  db.close();

  console.log(`✅ Seeded ${services.length} services`);
}

seed().catch(console.error);
