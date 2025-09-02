const express = require("express");
const { pool } = require("../db");
const { authentication } = require("../middleware/auth");

const router = express.Router();

/**
 * Doctor creates slots in a centre
 */
router.post("/", authentication, async (req, res) => {
  try {
    const { centre_id, start_time, end_time, cost } = req.body;

    if (req.user.account_type !== "doctor") {
      return res.status(403).json({ message: "Only doctors can create slots" });
    }

    if (!centre_id || !start_time || !end_time || !cost) {
      return res
        .status(400)
        .json({ message: "centre_id, start_time, end_time, cost required" });
    }

    // Insert into booking (slot without patient yet)
    const [bookingResult] = await pool.query(
      `INSERT INTO Booking (start_time, end_time, cost, doctor_id, customer_id)
       VALUES (?, ?, ?, ?, NULL)`,
      [start_time, end_time, cost, req.user.user_id]
    );

    const booking_id = bookingResult.insertId;

    // Link to slots table
    await pool.query(
      `INSERT INTO slots (centre_id, doctor_id, booking_id)
       VALUES (?, ?, ?)`,
      [centre_id, req.user.user_id, booking_id]
    );

    // Return enriched slot details
    const [[slot]] = await pool.query(
      `SELECT b.booking_id, b.start_time, b.end_time, b.cost,
              d.user_id AS doctor_id, d.first_name AS doctor_first_name, d.last_name AS doctor_last_name, d.specialization, d.phone_number AS doctor_phone,
              c.centre_id, c.name AS centre_name, c.adress, c.division, c.district, c.street, c.post_code, c.country
       FROM Booking b
       JOIN slots s ON b.booking_id = s.booking_id
       JOIN app_user d ON b.doctor_id = d.user_id
       JOIN Centre c ON s.centre_id = c.centre_id
       WHERE b.booking_id = ?`,
      [booking_id]
    );

    return res.status(201).json({
      message: "Slot created",
      slot,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * Patient views available slots in a centre
 */
router.get("/:centre_id", async (req, res) => {
  try {
    const { centre_id } = req.params;

    const [rows] = await pool.query(
      `SELECT b.booking_id, b.start_time, b.end_time, b.cost,
              d.user_id AS doctor_id, d.first_name AS doctor_first_name, d.last_name AS doctor_last_name, d.specialization, d.phone_number AS doctor_phone,
              c.centre_id, c.name AS centre_name, c.adress, c.division, c.district, c.street, c.post_code, c.country
       FROM slots s
       JOIN Booking b ON s.booking_id = b.booking_id
       JOIN app_user d ON s.doctor_id = d.user_id
       JOIN Centre c ON s.centre_id = c.centre_id
       WHERE s.centre_id = ? AND b.customer_id IS NULL`,
      [centre_id]
    );

    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * Patient books a slot
 */
router.post("/book/:booking_id", authentication, async (req, res) => {
  try {
    if (req.user.account_type !== "patient") {
      return res.status(403).json({ message: "Only patients can book slots" });
    }

    const { booking_id } = req.params;

    // Check if slot already booked
    const [rows] = await pool.query(
      `SELECT customer_id FROM Booking WHERE booking_id = ?`,
      [booking_id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Slot not found" });
    }

    if (rows[0].customer_id) {
      return res.status(400).json({ message: "Slot already booked" });
    }

    // Assign patient to booking
    await pool.query(
      `UPDATE Booking SET customer_id = ? WHERE booking_id = ?`,
      [req.user.user_id, booking_id]
    );

    // Return enriched slot details
    const [[slot]] = await pool.query(
      `SELECT b.booking_id, b.start_time, b.end_time, b.cost,
              d.user_id AS doctor_id, d.first_name AS doctor_first_name, d.last_name AS doctor_last_name, d.specialization, d.phone_number AS doctor_phone,
              p.user_id AS patient_id, p.first_name AS patient_first_name, p.last_name AS patient_last_name, p.email AS patient_email, p.phone_number AS patient_phone,
              c.centre_id, c.name AS centre_name, c.adress, c.division, c.district, c.street, c.post_code, c.country
       FROM Booking b
       JOIN slots s ON b.booking_id = s.booking_id
       JOIN app_user d ON b.doctor_id = d.user_id
       JOIN app_user p ON b.customer_id = p.user_id
       JOIN Centre c ON s.centre_id = c.centre_id
       WHERE b.booking_id = ?`,
      [booking_id]
    );

    return res.json({ message: "Slot booked successfully", slot });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * Doctor views bookings for their slots
 */
router.get("/doctor/bookings", authentication, async (req, res) => {
  try {
    if (req.user.account_type !== "doctor") {
      return res.status(403).json({ message: "Only doctors can view their bookings" });
    }

    const [rows] = await pool.query(
      `SELECT b.booking_id, b.start_time, b.end_time, b.cost,
              p.user_id AS patient_id, p.first_name AS patient_first_name, p.last_name AS patient_last_name, p.email AS patient_email, p.phone_number AS patient_phone,
              d.user_id AS doctor_id, d.first_name AS doctor_first_name, d.last_name AS doctor_last_name, d.specialization,
              c.centre_id, c.name AS centre_name, c.adress, c.division, c.district, c.street, c.post_code, c.country
       FROM Booking b
       JOIN slots s ON b.booking_id = s.booking_id
       JOIN app_user d ON b.doctor_id = d.user_id
       JOIN app_user p ON b.customer_id = p.user_id
       JOIN Centre c ON s.centre_id = c.centre_id
       WHERE b.doctor_id = ? AND b.customer_id IS NOT NULL`,
      [req.user.user_id]
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * Patient views their bookings
 */
router.get("/patient/bookings", authentication, async (req, res) => {
  try {
    if (req.user.account_type !== "patient") {
      return res.status(403).json({ message: "Only patients can view their bookings" });
    }

    const [rows] = await pool.query(
      `SELECT b.booking_id, b.start_time, b.end_time, b.cost,
              d.user_id AS doctor_id, d.first_name AS doctor_first_name, d.last_name AS doctor_last_name, d.specialization, d.phone_number AS doctor_phone,
              p.user_id AS patient_id, p.first_name AS patient_first_name, p.last_name AS patient_last_name, p.email AS patient_email, p.phone_number AS patient_phone,
              c.centre_id, c.name AS centre_name, c.adress, c.division, c.district, c.street, c.post_code, c.country
       FROM Booking b
       JOIN slots s ON b.booking_id = s.booking_id
       JOIN app_user d ON b.doctor_id = d.user_id
       JOIN app_user p ON b.customer_id = p.user_id
       JOIN Centre c ON s.centre_id = c.centre_id
       WHERE b.customer_id = ?`,
      [req.user.user_id]
    );

    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});
// GET slots for a doctor (patients can view & book them)
router.get("/doctor/:doctor_id", async (req, res) => {
  try {
    const { doctor_id } = req.params;
    const [rows] = await pool.query(
      `SELECT b.booking_id, b.start_time, b.end_time, b.cost, s.centre_id, s.doctor_id
       FROM Booking b
       JOIN slots s ON b.booking_id = s.booking_id
       WHERE s.doctor_id = ? AND b.customer_id IS NULL`,
      [doctor_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
/**
 * Cancel booking
 */
router.delete("/cancel/:booking_id", authentication, async (req, res) => {
  try {
    const { booking_id } = req.params;

    // Get booking info
    const [rows] = await pool.query(
      `SELECT doctor_id, customer_id FROM Booking WHERE booking_id = ?`,
      [booking_id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const booking = rows[0];

    // If patient wants to cancel
    if (req.user.account_type === "patient") {
      if (booking.customer_id !== req.user.user_id) {
        return res.status(403).json({ message: "You can only cancel your own bookings" });
      }

      await pool.query(
        `UPDATE Booking SET customer_id = NULL WHERE booking_id = ?`,
        [booking_id]
      );

      return res.json({ message: "Booking cancelled, slot is now available again" });
    }

    // If doctor wants to cancel
    if (req.user.account_type === "doctor") {
      if (booking.doctor_id !== req.user.user_id) {
        return res.status(403).json({ message: "You can only cancel your own slots" });
      }

      // First delete from slots table
      await pool.query(`DELETE FROM slots WHERE booking_id = ?`, [booking_id]);

      // Then delete from Booking table
      await pool.query(`DELETE FROM Booking WHERE booking_id = ?`, [booking_id]);

      return res.json({ message: "Slot deleted successfully" });
    }

    return res.status(403).json({ message: "Unauthorized" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
