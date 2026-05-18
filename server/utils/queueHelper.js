import pool from '../config/db.js';

/**
 * Generate the next queue number for a given doctor on a given date.
 * Format: {DoctorCode}-{XX} where XX is zero-padded sequential number.
 * Queue numbers reset daily but NOT per-shift.
 * 
 * @param {number} doctorId - The doctor's account_id
 * @param {string} date - The queue date (YYYY-MM-DD)
 * @returns {string} The generated queue number (e.g., "D-01")
 */
export async function generateQueueNumber(doctorId, date) {
  // Get doctor code
  const doctorResult = await pool.query(
    'SELECT doctor_code FROM doctor_details WHERE account_id = $1',
    [doctorId]
  );

  if (doctorResult.rows.length === 0) {
    throw new Error('Dokter tidak ditemukan.');
  }

  const doctorCode = doctorResult.rows[0].doctor_code;

  // Count existing queues for this doctor today (across all shifts)
  const countResult = await pool.query(
    `SELECT COUNT(*) as total FROM queues q
     JOIN schedules s ON q.schedule_id = s.id
     WHERE s.doctor_id = $1 AND q.queue_date = $2`,
    [doctorId, date]
  );

  const nextNumber = parseInt(countResult.rows[0].total) + 1;
  const paddedNumber = String(nextNumber).padStart(2, '0');

  return `${doctorCode}-${paddedNumber}`;
}

/**
 * Get remaining quota for a schedule on a given date.
 * Cancelled queues restore quota.
 * 
 * @param {number} scheduleId - The schedule ID
 * @param {string} date - The date to check (YYYY-MM-DD)
 * @returns {number} Remaining quota
 */
export async function getRemainingQuota(scheduleId, date) {
  const scheduleResult = await pool.query(
    'SELECT max_quota FROM schedules WHERE id = $1',
    [scheduleId]
  );

  if (scheduleResult.rows.length === 0) {
    throw new Error('Jadwal tidak ditemukan.');
  }

  const maxQuota = scheduleResult.rows[0].max_quota;

  // Count active queues (not cancelled)
  const activeResult = await pool.query(
    `SELECT COUNT(*) as active FROM queues 
     WHERE schedule_id = $1 AND queue_date = $2 AND status != 'Dibatalkan'`,
    [scheduleId, date]
  );

  const activeCount = parseInt(activeResult.rows[0].active);

  return maxQuota - activeCount;
}
