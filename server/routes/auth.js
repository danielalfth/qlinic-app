import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/auth/signup
 * Register a new patient account
 */
router.post('/signup', async (req, res) => {
  try {
    const { fullName, phoneNumber, gender, age, email, password } = req.body;

    // Validation
    if (!fullName || !phoneNumber || !gender || !age || !password) {
      return res.status(400).json({ error: 'Semua field wajib diisi (kecuali email).' });
    }

    if (!['L', 'P'].includes(gender)) {
      return res.status(400).json({ error: 'Jenis kelamin harus L atau P.' });
    }

    if (parseInt(age) < 0 || parseInt(age) > 150) {
      return res.status(400).json({ error: 'Usia tidak valid.' });
    }

    // Check if phone number already exists
    const phoneCheck = await pool.query(
      'SELECT id FROM accounts WHERE phone_number = $1',
      [phoneNumber]
    );
    if (phoneCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Nomor telepon sudah terdaftar.' });
    }

    // Check if email already exists (if provided)
    if (email) {
      const emailCheck = await pool.query(
        'SELECT id FROM accounts WHERE email = $1',
        [email]
      );
      if (emailCheck.rows.length > 0) {
        return res.status(409).json({ error: 'Email sudah terdaftar.' });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert account
    const accountResult = await pool.query(
      `INSERT INTO accounts (email, phone_number, password, role)
       VALUES ($1, $2, $3, 'pasien')
       RETURNING id`,
      [email || null, phoneNumber, hashedPassword]
    );

    const accountId = accountResult.rows[0].id;

    // Insert patient details
    await pool.query(
      `INSERT INTO patient_details (account_id, full_name, gender, age)
       VALUES ($1, $2, $3, $4)`,
      [accountId, fullName, gender, parseInt(age)]
    );

    // Generate JWT
    const token = jwt.sign(
      { id: accountId, role: 'pasien', fullName },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Registrasi berhasil!',
      token,
      user: { id: accountId, role: 'pasien', fullName },
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

/**
 * POST /api/auth/login
 * Login with email/phone + password
 */
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email/No. Telepon dan password wajib diisi.' });
    }

    // Find account by email or phone number
    const accountResult = await pool.query(
      'SELECT * FROM accounts WHERE email = $1 OR phone_number = $1',
      [identifier]
    );

    if (accountResult.rows.length === 0) {
      return res.status(401).json({ error: 'Email/No. Telepon atau password salah.' });
    }

    const account = accountResult.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, account.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email/No. Telepon atau password salah.' });
    }

    // Get user details based on role
    let fullName = '';
    let details = {};

    if (account.role === 'pasien') {
      const result = await pool.query(
        'SELECT * FROM patient_details WHERE account_id = $1',
        [account.id]
      );
      fullName = result.rows[0]?.full_name || '';
      details = result.rows[0] || {};
    } else if (account.role === 'dokter') {
      const result = await pool.query(
        'SELECT * FROM doctor_details WHERE account_id = $1',
        [account.id]
      );
      fullName = result.rows[0]?.full_name || '';
      details = result.rows[0] || {};
    } else if (account.role === 'admin') {
      const result = await pool.query(
        'SELECT * FROM admin_details WHERE account_id = $1',
        [account.id]
      );
      fullName = result.rows[0]?.full_name || '';
      details = result.rows[0] || {};
    }

    // Generate JWT
    const token = jwt.sign(
      { id: account.id, role: account.role, fullName },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login berhasil!',
      token,
      user: {
        id: account.id,
        role: account.role,
        fullName,
        email: account.email,
        phoneNumber: account.phone_number,
        ...details,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile from JWT
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const { id, role } = req.user;

    const accountResult = await pool.query(
      'SELECT id, email, phone_number, role, created_at FROM accounts WHERE id = $1',
      [id]
    );

    if (accountResult.rows.length === 0) {
      return res.status(404).json({ error: 'Akun tidak ditemukan.' });
    }

    const account = accountResult.rows[0];
    let details = {};

    if (role === 'pasien') {
      const result = await pool.query('SELECT * FROM patient_details WHERE account_id = $1', [id]);
      details = result.rows[0] || {};
    } else if (role === 'dokter') {
      const result = await pool.query('SELECT * FROM doctor_details WHERE account_id = $1', [id]);
      details = result.rows[0] || {};
    } else if (role === 'admin') {
      const result = await pool.query('SELECT * FROM admin_details WHERE account_id = $1', [id]);
      details = result.rows[0] || {};
    }

    res.json({
      ...account,
      ...details,
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

/**
 * PATCH /api/auth/profile
 * Update current user's full name and/or password
 */
router.patch('/profile', authenticate, async (req, res) => {
  try {
    const { id, role } = req.user;
    const { fullName, currentPassword, newPassword } = req.body;

    if (!fullName && !newPassword) {
      return res.status(400).json({ error: 'Tidak ada data yang diubah.' });
    }

    // If changing password, verify current password first
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Password saat ini wajib diisi untuk mengubah password.' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password baru minimal 6 karakter.' });
      }

      const accountResult = await pool.query('SELECT password FROM accounts WHERE id = $1', [id]);
      const isValid = await bcrypt.compare(currentPassword, accountResult.rows[0].password);
      if (!isValid) {
        return res.status(401).json({ error: 'Password saat ini tidak sesuai.' });
      }

      const hashedNew = await bcrypt.hash(newPassword, 10);
      await pool.query('UPDATE accounts SET password = $1 WHERE id = $2', [hashedNew, id]);
    }

    // Update full name in the appropriate details table
    if (fullName) {
      if (fullName.trim().length < 2) {
        return res.status(400).json({ error: 'Nama minimal 2 karakter.' });
      }

      const tableMap = { pasien: 'patient_details', dokter: 'doctor_details', admin: 'admin_details' };
      const table = tableMap[role];
      await pool.query(`UPDATE ${table} SET full_name = $1 WHERE account_id = $2`, [fullName.trim(), id]);
    }

    // Return updated user data
    const accountResult = await pool.query(
      'SELECT id, email, phone_number, role FROM accounts WHERE id = $1',
      [id]
    );
    const account = accountResult.rows[0];

    const tableMap = { pasien: 'patient_details', dokter: 'doctor_details', admin: 'admin_details' };
    const detailResult = await pool.query(
      `SELECT * FROM ${tableMap[role]} WHERE account_id = $1`,
      [id]
    );
    const details = detailResult.rows[0] || {};

    res.json({
      message: 'Profil berhasil diperbarui.',
      user: { ...account, ...details },
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

export default router;
