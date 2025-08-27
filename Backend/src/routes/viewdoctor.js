const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');
const {signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken} = require("../utils/jwt")
const { authentication, authorize, isValidEmail } = require("../middleware/auth")

const router = express.Router();


router.get('/', authentication, async (req , res) => {
  try {

    const [doctorrows] = await pool.query("select * from app_user where account_type = ?", ["doctor"]);

    if (!doctorrows.length) {
      return res.status(404).json({message: 'doctor not found!!!!!!!!'});
    }

    return res.status(201).json({message: "success", doctors: doctorrows});
    
  } catch (error) {
    console.log(error);
    console.log('problems in get doctors')
    return res.status(500).json({message: 'doctors not found!!!!!!!!'});
  }
})

router.get('/:doctor_id', authentication, async (req , res) => {
  try {
    const { doctor_id } = req.params; 

    const [doctorrows] = await pool.query("select * from app_user where account_type = ? and user_id = ? limit 1", ["doctor", doctor_id]);

    if (!doctorrows.length) {
      return res.status(404).json({message: 'doctor not found!!!!!!!!'});
    }

    return res.status(201).json({message: "success", doctors: doctorrows});
    
  } catch (error) {
    console.log(error);
    console.log('problems in get doctors')
    return res.status(500).json({message: 'doctors not found!!!!!!!!'});
  }
})

module.exports = router;
