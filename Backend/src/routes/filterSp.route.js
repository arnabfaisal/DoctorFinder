const express = require("express");
const { pool } = require("../db");
const { authentication } = require("../middleware/auth");
const router = express.Router();

/**
 * Patient filters doctors by specialization
 * Query params: specialization
 */

// api/filterSp/

router.get("/", authentication, async (req, res) => {
  try {
    if (req.user.account_type !== "patient") {
      return res.status(403).json({ message: "Only patients can search slots" });
    }

    const { specialization } = req.query;
    console.log(req.query);
    
    let query = `
      SELECT user_id, first_name, last_name, specialization, reputation,
        city, division, district, street
      FROM app_user
      WHERE account_type = 'doctor' 
    `; // and specialization like ?, [spceilization]
    
    const params = [];
    
    if (specialization) {
      query += " AND specialization LIKE ?";
      params.push(`%${specialization}%`);
    }
    
    query += " ORDER BY first_name ASC";
    
    const [rows] = await pool.query(query, params);
    return res.json(rows);
    
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/doctor/:doctor_id/centres", authentication, async (req, res) => {
  try {
    const { doctor_id } = req.params;

    const query = `
      SELECT DISTINCT 
        c.centre_id, c.name AS centre_name, c.city, c.division, c.district
      FROM slots s
      JOIN Booking b ON s.booking_id = b.booking_id
      JOIN Centre c ON s.centre_id = c.centre_id
      WHERE s.doctor_id = ? AND b.customer_id IS NULL
      ORDER BY c.name ASC
    `;
    
    const [rows] = await pool.query(query, [doctor_id]);
    return res.json(rows);
    
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;