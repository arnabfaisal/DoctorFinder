const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');
const {signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken} = require("../utils/jwt")
const { authentication, authorize, isValidEmail } = require("../middleware/auth")

const router = express.Router();


// api/review/

router.post('/', authentication, async (req, res) => {

  try {
    const { doctor_id, rating, commented } = req.body; 
    const reviewer_id = req.user.user_id;



    if (!doctor_id || !rating) {
      return res.status(400).json({ message: 'doctor_id and rating are required' });
    }

    if (doctor_id === reviewer_id) {
      return res.status(400).json({ message: 'You cannot review yourself' });
    }


    const [doctorrows] = await pool.query("select user_id, account_type from app_user where user_id = ? limit 1", [doctor_id]);

    if (!doctorrows.length) {
      return res.status(404).json({message: 'doctor not found!!!!!!!!'});
    }

    await pool.query('insert into Review (reviewer_id, doctor_id, rating, commented, created_at, updated_at) values (?, ? , ? , ?, NOW() , NOW())',
      [reviewer_id, doctor_id, rating, commented || NULL]
    );


    const [avgRows] = await pool.query("select avg(rating) as avgg from Review where doctor_id = ?", [doctor_id])

    const currAvg = avgRows[0].avgg || 0 

    await pool.query('update app_user set reputation = ? where user_id = ?', [currAvg, doctor_id]);

    return res.status(201).json({message: "review added successfully. rating updated sucessfully", reputation: currAvg});

  } catch (error) {
    console.log(error);
    console.log("bad happend in review post request1")
    return res.status(500).json({message: "review.routes.js e problem!!"})
  }
})

// shob review doctor er
router.get('/:doctor_id', async (req, res) => {
  try{
    const { doctor_id } = req.params; 

    const [doctorRows] = await pool.query(
      'SELECT user_id, account_type, reputation FROM app_user WHERE user_id = ? LIMIT 1',
      [doctor_id]
    );
    if (!doctorRows.length || doctorRows[0].account_type !== 'doctor') {
      return res.status(404).json({ message: 'Doctor not found' });
      }

    const [reviews] = await pool.query(
      'select r.reviewer_id, r.rating, r.commented, r.created_at, r.updated_at, u.first_name as reviewer_first, u.last_name as reviewer_last from Review r join app_user u on r.reviewer_id = u.user_id where r.doctor_id = ? order by r.created_at desc', [doctor_id]
    );


    return res.json({
      doctor_id,
      reputation: doctorRows[0].reputation,
      reviews,
    });
  
  } catch(error) {
    console.log(error);
    console.log("something bad happend at reviews get")
    return res.status(500).json({ message: 'bad happened at reviews GET' });
  }
});

module.exports = router;