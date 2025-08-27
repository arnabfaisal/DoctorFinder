const express = require('express');
const { pool } = require('../db');
const { authentication, authorize } = require("../middleware/auth");
const router = express.Router();


router.post('/', authentication, async (req, res) => {
  try {
    const { doctor_id, content } = req.body;
    const reporter_id = req.user.user_id; 
    if (!doctor_id || !content) {
      return res.status(400).json({ message: "doctor_id and content are required" });
    }

    const [doctor] = await pool.query(
      "SELECT user_id, account_type FROM app_user WHERE user_id = ? AND account_type = 'doctor' LIMIT 1",
      [doctor_id]
    );
    if (!doctor.length) {
      return res.status(404).json({ message: "Doctor not found" });
    }


    const [result] = await pool.query(
      "INSERT INTO report (content, user_id, doctor_id) VALUES (?, ?, ?)",
      [content, reporter_id, doctor_id]
    );

    return res.status(201).json({
      message: "Report submitted successfully",
      report_id: result.insertId,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});


router.get('/', authentication, authorize('admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        r.report_id,
        r.content,
        r.report_date,
        r.is_solved,
        r.user_id AS patient_id,
        r.doctor_id,
        p.first_name AS patient_first,
        p.last_name AS patient_last,
        d.first_name AS doctor_first,
        d.last_name AS doctor_last
      FROM report r
      JOIN app_user p ON r.user_id = p.user_id
      JOIN app_user d ON r.doctor_id = d.user_id
      ORDER BY r.report_date DESC
    `);

    res.json({ reports: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


router.patch('/:id', authentication, async (req, res) => {
  try {
    if (req.user.account_type !== 'admin') {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }

    const { id } = req.params;
    const { is_solved } = req.body;

    const [result] = await pool.query(
      "UPDATE report SET is_solved = ?, updated_at = NOW() WHERE report_id = ?",
      [is_solved, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Report not found" });
    }

    return res.json({ message: "Report updated successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
