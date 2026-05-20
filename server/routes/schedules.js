import { Router } from 'express';
import pool from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { getRemainingQuota } from '../utils/queueHelper.js';

const router = Router();

/**
 * GET /api/schedules
 * Get all doctor schedules with room info
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id,
        s.shift,
        s.day_of_week,
        s.max_quota,
        d.account_id as doctor_id,
        d.full_name as doctor_name,
        d.doctor_code,
        d.specialization,
        d.photo_url,
        r.id as room_id,
        r.room_name
      FROM schedules s
      JOIN doctor_details d ON s.doctor_id = d.account_id
      JOIN rooms r ON s.room_id = r.id
      ORDER BY 
        CASE s.day_of_week
          WHEN 'Senin' THEN 1
          WHEN 'Selasa' THEN 2
          WHEN 'Rabu' THEN 3
          WHEN 'Kamis' THEN 4
          WHEN 'Jumat' THEN 5
        END,
        s.shift,
        r.id
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Get schedules error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

/**
 * GET /api/schedules/today
 * Get today's active schedules with remaining quota
 */
router.get('/today', authenticate, async (req, res) => {
  try {
    // Map JS day names to Indonesian
    const dayMap = {
      1: 'Senin', 2: 'Selasa', 3: 'Rabu', 4: 'Kamis', 5: 'Jumat',
    };

    const now = new Date();
    const dayNumber = now.getDay(); // 0=Sun, 1=Mon, ...
    const todayName = dayMap[dayNumber];

    if (!todayName) {
      return res.json([]); // Weekend — no schedules
    }

    const today = now.toISOString().split('T')[0];

    const result = await pool.query(`
      SELECT 
        s.id,
        s.shift,
        s.day_of_week,
        s.max_quota,
        d.account_id as doctor_id,
        d.full_name as doctor_name,
        d.doctor_code,
        d.specialization,
        d.photo_url,
        r.id as room_id,
        r.room_name
      FROM schedules s
      JOIN doctor_details d ON s.doctor_id = d.account_id
      JOIN rooms r ON s.room_id = r.id
      WHERE s.day_of_week = $1
      ORDER BY s.shift, r.id
    `, [todayName]);

    // Add remaining quota for each schedule
    const schedulesWithQuota = [];
    for (const schedule of result.rows) {
      try {
        const remaining = await getRemainingQuota(schedule.id, today);
        schedulesWithQuota.push({ ...schedule, remaining_quota: remaining });
      } catch (err) {
        console.error('Error computing remaining quota for schedule', schedule.id, err);
        // Fallback: set remaining quota to 0 so frontend won't show as available
        schedulesWithQuota.push({ ...schedule, remaining_quota: 0 });
      }
    }

    res.json(schedulesWithQuota);
  } catch (err) {
    console.error('Get today schedules error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

/**
 * GET /api/schedules/public
 * Public endpoint — no auth required (for landing page)
 */
router.get('/public', async (req, res) => {
  try {
    // Get unique doctors with their schedule info
    const result = await pool.query(`
      SELECT DISTINCT ON (d.account_id)
        d.account_id as doctor_id,
        d.full_name as doctor_name,
        d.doctor_code,
        d.specialization,
        d.photo_url
      FROM doctor_details d
      ORDER BY d.account_id
    `);

    // Get schedules grouped by doctor
    const schedules = await pool.query(`
      SELECT 
        s.id, s.shift, s.day_of_week, s.max_quota,
        s.doctor_id,
        r.room_name
      FROM schedules s
      JOIN rooms r ON s.room_id = r.id
      ORDER BY 
        CASE s.day_of_week
          WHEN 'Senin' THEN 1 WHEN 'Selasa' THEN 2 WHEN 'Rabu' THEN 3
          WHEN 'Kamis' THEN 4 WHEN 'Jumat' THEN 5
        END, s.shift
    `);

    const doctors = result.rows.map(doc => ({
      ...doc,
      schedules: schedules.rows.filter(s => s.doctor_id === doc.doctor_id),
    }));

    res.json(doctors);
  } catch (err) {
    console.error('Get public schedules error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

export default router;
