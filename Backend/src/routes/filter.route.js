const express = require("express");
const { pool } = require("../db");
const { authentication } = require("../middleware/auth");

const router = express.Router();

/**
 * Get filtered slots for a specific doctor
 * GET /api/filter/doctor/:doctor_id/slots
 * Query params: minCost, maxCost, centre_id
 */
router.get("/doctor/:doctor_id/slots", authentication, async (req, res) => {
  try {
    const { doctor_id } = req.params;
    const { minCost, maxCost, centre_id } = req.query;

    let query = `
      SELECT 
        b.booking_id, b.start_time, b.end_time, b.cost,
        s.centre_id, s.doctor_id,
        c.name AS centre_name, c.adress, c.city, c.division, c.district, c.street, c.post_code, c.country
      FROM slots s
      JOIN Booking b ON s.booking_id = b.booking_id
      JOIN Centre c ON s.centre_id = c.centre_id
      WHERE s.doctor_id = ? AND b.customer_id IS NULL
    `;
    
    const params = [doctor_id];
    
    if (minCost) {
      query += " AND b.cost >= ?";
      params.push(Number(minCost));
    }
    
    if (maxCost) {
      query += " AND b.cost <= ?";
      params.push(Number(maxCost));
    }
    
    if (centre_id) {
      query += " AND s.centre_id = ?";
      params.push(Number(centre_id));
    }
    
    query += " ORDER BY b.start_time ASC";
    
    const [rows] = await pool.query(query, params);
    return res.json(rows);
    
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * Get cost range for a specific doctor's slots
 * GET /api/filter/doctor/:doctor_id/cost-range
 */
router.get("/doctor/:doctor_id/cost-range", authentication, async (req, res) => {
  try {
    const { doctor_id } = req.params;

    const query = `
      SELECT 
        MIN(b.cost) as min_cost,
        MAX(b.cost) as max_cost,
        AVG(b.cost) as avg_cost,
        COUNT(*) as total_slots
      FROM slots s
      JOIN Booking b ON s.booking_id = b.booking_id
      WHERE s.doctor_id = ? AND b.customer_id IS NULL
    `;
    
    const [rows] = await pool.query(query, [doctor_id]);
    return res.json(rows[0] || { min_cost: 0, max_cost: 0, avg_cost: 0, total_slots: 0 });
    
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * Get all available slots for a doctor with full details (alternative to existing endpoint)
 * GET /api/filter/doctor/:doctor_id/all-slots
 */
router.get("/doctor/:doctor_id/all-slots", async (req, res) => {
  try {
    const { doctor_id } = req.params;
    
    const query = `
      SELECT 
        b.booking_id, b.start_time, b.end_time, b.cost,
        s.centre_id, s.doctor_id,
        c.name AS centre_name, c.adress, c.city, c.division, c.district, c.street, c.post_code, c.country
      FROM slots s
      JOIN Booking b ON s.booking_id = b.booking_id
      JOIN Centre c ON s.centre_id = c.centre_id
      WHERE s.doctor_id = ? AND b.customer_id IS NULL
      ORDER BY b.start_time ASC
    `;
    
    const [rows] = await pool.query(query, [doctor_id]);
    return res.json(rows);
    
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * Search slots across all doctors (for general search)
 * GET /api/filter/slots/search
 * Query params: minCost, maxCost, city, division, specialization
 */
router.get("/slots/search", authentication, async (req, res) => {
  try {
    if (req.user.account_type !== "patient") {
      return res.status(403).json({ message: "Only patients can search slots" });
    }

    const { minCost, maxCost, city, division, specialization } = req.query;
    
    let query = `
      SELECT DISTINCT 
        d.user_id, d.first_name, d.last_name, d.specialization, d.reputation,
        c.centre_id, c.name AS centre_name, c.city, c.division, c.district,
        b.cost, b.booking_id, b.start_time, b.end_time
      FROM slots s
      JOIN Booking b ON s.booking_id = b.booking_id
      JOIN app_user d ON s.doctor_id = d.user_id
      JOIN Centre c ON s.centre_id = c.centre_id
      WHERE b.customer_id IS NULL
    `;
    
    const params = [];
    
    if (minCost) {
      query += " AND b.cost >= ?";
      params.push(Number(minCost));
    }
    
    if (maxCost) {
      query += " AND b.cost <= ?";
      params.push(Number(maxCost));
    }
    
    if (city) {
      query += " AND c.city LIKE ?";
      params.push(`%${city}%`);
    }
    
    if (division) {
      query += " AND c.division LIKE ?";
      params.push(`%${division}%`);
    }
    
    if (specialization) {
      query += " AND d.specialization LIKE ?";
      params.push(`%${specialization}%`);
    }
    
    query += " ORDER BY d.first_name ASC, b.start_time ASC";
    
    const [rows] = await pool.query(query, params);
    return res.json(rows);
    
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;