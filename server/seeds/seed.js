import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🌱 Starting database seed...');
    await client.query('BEGIN');

    // Drop tables in reverse order
    await client.query(`
      DROP TABLE IF EXISTS medical_records CASCADE;
      DROP TABLE IF EXISTS queues CASCADE;
      DROP TABLE IF EXISTS schedules CASCADE;
      DROP TABLE IF EXISTS rooms CASCADE;
      DROP TABLE IF EXISTS admin_details CASCADE;
      DROP TABLE IF EXISTS doctor_details CASCADE;
      DROP TABLE IF EXISTS patient_details CASCADE;
      DROP TABLE IF EXISTS accounts CASCADE;
      DROP TYPE IF EXISTS queue_status CASCADE;
      DROP TYPE IF EXISTS gender_type CASCADE;
      DROP TYPE IF EXISTS user_role CASCADE;
    `);
    console.log('✅ Dropped existing tables');

    // Create ENUM types
    await client.query(`
      CREATE TYPE user_role AS ENUM ('pasien', 'dokter', 'admin');
      CREATE TYPE gender_type AS ENUM ('L', 'P');
      CREATE TYPE queue_status AS ENUM ('Menunggu', 'Diperiksa', 'Selesai', 'Dilewati', 'Dibatalkan');
    `);

    // Create tables
    await client.query(`
      CREATE TABLE accounts (
        id SERIAL PRIMARY KEY,
        email VARCHAR(100) UNIQUE,
        phone_number VARCHAR(15) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role user_role NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE patient_details (
        account_id INTEGER PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
        full_name VARCHAR(100) NOT NULL,
        gender gender_type NOT NULL,
        age INTEGER NOT NULL
      );
      CREATE TABLE doctor_details (
        account_id INTEGER PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
        full_name VARCHAR(100) NOT NULL,
        doctor_code CHAR(1) UNIQUE NOT NULL,
        specialization VARCHAR(50) DEFAULT 'Dokter Umum',
        photo_url VARCHAR(255)
      );
      CREATE TABLE admin_details (
        account_id INTEGER PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
        full_name VARCHAR(100) NOT NULL
      );
      CREATE TABLE rooms (
        id SERIAL PRIMARY KEY,
        room_name VARCHAR(50) NOT NULL
      );
      CREATE TABLE schedules (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER REFERENCES doctor_details(account_id),
        room_id INTEGER REFERENCES rooms(id),
        shift INTEGER CHECK (shift IN (1, 2)),
        day_of_week VARCHAR(10) NOT NULL,
        max_quota INTEGER DEFAULT 20,
        CONSTRAINT working_days_only CHECK (
          day_of_week IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat')
        )
      );
      CREATE TABLE queues (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patient_details(account_id),
        schedule_id INTEGER REFERENCES schedules(id),
        queue_number VARCHAR(10) NOT NULL,
        status queue_status DEFAULT 'Menunggu',
        complaint TEXT,
        queue_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE medical_records (
        id SERIAL PRIMARY KEY,
        queue_id INTEGER UNIQUE REFERENCES queues(id),
        physical_exam TEXT,
        diagnosis TEXT,
        prescription TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created tables');

    const hashedPassword = await bcrypt.hash('password', 10);

    // Insert doctors
    const doctors = [
      { email: 'daniel@doctor.com', phone: '081111111101', name: 'Dr. Daniel', code: 'D', photo: '/images/doctors/dr-daniel.jpeg' },
      { email: 'zaki@doctor.com', phone: '081111111102', name: 'Dr. Zaki', code: 'Z', photo: '/images/doctors/dr-zaki.jpeg' },
      { email: 'amirah@doctor.com', phone: '081111111103', name: 'Dr. Amirah', code: 'A', photo: '/images/doctors/dr-mirah.jpeg' },
      { email: 'manda@doctor.com', phone: '081111111104', name: 'Dr. Manda', code: 'M', photo: '/images/doctors/dr-manda.jpeg' },
    ];

    for (const doc of doctors) {
      const accRes = await client.query(
        `INSERT INTO accounts (email, phone_number, password, role) VALUES ($1, $2, $3, 'dokter') RETURNING id`,
        [doc.email, doc.phone, hashedPassword]
      );
      await client.query(
        `INSERT INTO doctor_details (account_id, full_name, doctor_code, specialization, photo_url) VALUES ($1, $2, $3, 'Dokter Umum', $4)`,
        [accRes.rows[0].id, doc.name, doc.code, doc.photo]
      );
    }
    console.log('✅ Seeded 4 doctor accounts');

    // Insert admin
    const adminRes = await client.query(
      `INSERT INTO accounts (email, phone_number, password, role) VALUES ('admin@admin.com', '081111111100', $1, 'admin') RETURNING id`,
      [hashedPassword]
    );
    await client.query(
      `INSERT INTO admin_details (account_id, full_name) VALUES ($1, 'Admin')`,
      [adminRes.rows[0].id]
    );
    console.log('✅ Seeded admin account');

    // Insert rooms
    await client.query(`INSERT INTO rooms (room_name) VALUES ('Ruang 1'), ('Ruang 2')`);
    console.log('✅ Seeded 2 rooms');

    // Get doctor IDs
    const doctorRows = await client.query(`SELECT account_id, doctor_code FROM doctor_details ORDER BY doctor_code`);
    const doctorMap = {};
    doctorRows.rows.forEach(r => { doctorMap[r.doctor_code] = r.account_id; });

    // Insert schedules (Mon-Fri, 2 shifts each)
    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
    for (const day of days) {
      // Shift 1: Dr. Daniel (Room 1), Dr. Zaki (Room 2)
      await client.query(
        `INSERT INTO schedules (doctor_id, room_id, shift, day_of_week, max_quota) VALUES ($1, 1, 1, $2, 20), ($3, 2, 1, $2, 20)`,
        [doctorMap['D'], day, doctorMap['Z']]
      );
      // Shift 2: Dr. Amirah (Room 1), Dr. Manda (Room 2)
      await client.query(
        `INSERT INTO schedules (doctor_id, room_id, shift, day_of_week, max_quota) VALUES ($1, 1, 2, $2, 20), ($3, 2, 2, $2, 20)`,
        [doctorMap['A'], day, doctorMap['M']]
      );
    }
    console.log('✅ Seeded 20 schedule records (4 doctors × 5 days)');

    await client.query('COMMIT');
    console.log('\n🎉 Database seeded successfully!');
    console.log('\nCredentials:');
    console.log('  Dokter: daniel@doctor.com / password');
    console.log('  Dokter: zaki@doctor.com / password');
    console.log('  Dokter: amirah@doctor.com / password');
    console.log('  Dokter: manda@doctor.com / password');
    console.log('  Admin:  admin@admin.com / password');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
