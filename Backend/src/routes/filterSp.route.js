const express = require("express");
const { pool } = require("../db");
const { authentication } = require("../middleware/auth");
const router = express.Router();

/**
 * Patient filters doctors by specialization
 * Query params: specialization
 */
router.get("/", authentication, async (req, res) => {
  try {
    if (req.user.account_type !== "patient") {
      return res.status(403).json({ message: "Only patients can search slots" });
    }

    const { specialization } = req.query;
    
    let query = `
      SELECT user_id, first_name, last_name, specialization, reputation,
        city, division, district, street
      FROM app_user
      WHERE account_type = 'doctor'
    `;
    
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

module.exports = router;