const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');
const {signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken} = require("../utils/jwt")
const { authentication, authorize, isValidEmail } = require("../middleware/auth")


const router = express.Router();


//POST create chat between dcotor and patient

router.post('/create', authentication, async (req, res) => {
  try {

    const { doctor_id, patient_id } = req.body;

    if (!doctor_id || !patient_id) {
      return res.status(400).json({ message: 'doctor_id and patient_id are required' });
    }


    const [doctor] = await pool.query(
      "select user_id from app_user where user_id = ? and account_type = 'doctor'", [doctor_id]
    )

    const [patient] = await pool.query(
      "select user_id from app_user where user_id = ? and account_type = 'patient'", [patient_id]
    );


    if (!doctor.length || !patient.length) {
      return res.status(400).json({ message: 'Invalid doctor_id or patient_id' });
    }


    const [ifExists] = await pool.query(
      'select * from chat where doctor_id = ? and patient_id = ? limit 1',[doctor_id, patient_id]
    )

    if (ifExists.length) {
      return res.json({ message: "Chat already exists", chat: ifExists[0] });
    }

    const [result] = await pool.query(
      "INSERT INTO chat (doctor_id, patient_id, created_at, updated_at) VALUES (?, ?, NOW(), NOW())",
      [doctor_id, patient_id]
    );

    return res.status(201).json({ message: "Chat created", chat_id: result.insertId });
    
  } catch (error) {
    console.log(error);
    console.log("something happend bad at /create")
    return res.status(500).json({ message: "Server error /create has a problem" });
  }
})



router.get('/my-chats', authentication, async (req , res) => {
  try {

    const { user_id, account_type} = req.user;
    
    let query;

    if(account_type === "doctor") {
      query = 'select * from chat where doctor_id = ?';
    } else if(account_type === "patient") {
      query = 'select * from chat where patient_id = ?';
    } else{
      return res.status(403).json({ message: "Only doctors or patients can have chats" });
    }



    const [rows] = await pool.query(
      query, [user_id]
    )

    return res.json(rows);
    

  } catch (error) {
    console.log(error);
    console.log("something happend bad at /my-chats")
    return res.status(500).json({ message: "Server error /my-chats has a problem" });
    
  }

})





//POST sending messager

router.post("/send", authentication, async (req, res) => {

  try {
    const { chat_id, content } = req.body;
    const {user_id, account_type } = req.user;

    if (!chat_id || !content) {
      return res.status(400).json({ message: 'chat_id and content are required' });
    }

    const [result] = await pool.query(
      "INSERT INTO msg (sender_id, sender_role, content, created_at, updated_at, chat_id) VALUES (?, ?, ?, NOW(), NOW(), ?)",
      [user_id, account_type, content, chat_id]
    );


    await pool.query(
      "UPDATE chat SET last_message=?, updated_at=NOW() WHERE chat_id=?",
      [content, chat_id]
    );

    return res.status(201).json({ message: "Message sent", msg_id: result.insertId });



    
  } catch (error) {
      console.log(error);
      console.log("something happend bad at /sending")
      return res.status(500).json({ message: "Server error /send has a propblelm" });
  }

})



// GET all message 

router.get('/:chat_id/messages', authentication, async (req, res) => {

  try {
    const {chat_id } = req.params; 

    const [rows] = await pool.query(
      'select * from msg where chat_id = ? order by created_at asc', [chat_id]
    )

    return res.json(rows);

  } catch (error) {
      console.log(error);
      console.log("something happend bad at /:chat_id/message")
      return res.status(500).json({ message: "Server error /:chat_id/messages has a propblelm" }); 
  }
})

module.exports = router;