const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');
const {signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken} = require("../utils/jwt")
const { authentication, authorize, isValidEmail } = require("../middleware/auth")

const router = express.Router();


router.get('/', authentication, async (req , res) => {
  try {

    const [centrerows] = await pool.query("select * from Centre");

    if (!centrerows.length) {
      return res.status(404).json({message: 'centre not found!!!!!!!!'});
    }

    return res.status(201).json({message: "success", centre: centrerows});
    
  } catch (error) {
    console.log(error);
    console.log('problems in get centre')
    return res.status(500).json({message: 'centre not found!!!!!!!!'});
  }
})

router.get('/:centre_id', authentication, async (req , res) => {
  try {
    const { centre_id } = req.params; 

    const [centrerows] = await pool.query("select * from Centre where centre_id = ? limit 1", [centre_id]);

    if (!centrerows.length) {
      return res.status(404).json({message: 'centre not found!!!!!!!!'});
    }

    return res.status(201).json({message: "success", centre: centrerows});
    
  } catch (error) {
    console.log(error);
    console.log('problems in get centres')
    return res.status(500).json({message: 'centres not found!!!!!!!!'});
  }
})

module.exports = router;
