const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');
const {signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken} = require("../utils/jwt")
const { authentication, authorize, isValidEmail } = require("../middleware/auth")


const router = express.Router();

router.post('/register', async (req , res) => {

    try {
        const {
            first_name,
            last_name,
            email,
            password,
            account_type,
            phone_number
        } = req.body; 

        if(!first_name || !last_name || !email || !password || !phone_number) {
            return res.status(400).json({ message: 'first_name, last_name, email, password, phone_number are required' });
        }

        if (!isValidEmail(email)) return res.status(400).json({ message: 'Invalid email' });

        const role = ['doctor', 'patient', 'admin'].includes(account_type) ? account_type : 'patient';

        
        const [exists] = await pool.query('select user_id from app_user where email = ?', [email]);

        if(exists.length) {
            return res.status(409).json({message: 'email already exists'})
        }

        const password_hash = await bcrypt.hash(password,10);

        const[result] = await pool.query('insert into app_user (first_name, last_name, email, password_hash, account_type, phone_number) values(?, ?, ?, ?, ?, ?)',[first_name,last_name,email,password_hash,role, phone_number]);

        /*
        console.log(result) => 
            ResultSetHeader {
            fieldCount: 0,
            affectedRows: 1,
            insertId: 10,
            info: '',
            serverStatus: 2,
            warningStatus: 0,
            changedRows: 0
            }
        */
        const user_id = result.insertId;


        const accessToken = signAccessToken({user_id,account_type: role});

        const refreshToken = signRefreshToken({user_id, account_type: role});

        await pool.query('UPDATE app_user SET refresh_token = ? WHERE user_id = ?', [refreshToken, user_id]);

        return res.status(201).json({
        message: 'Registered successfully',
        accessToken,
        refreshToken,
        user: { user_id, first_name, last_name, email, account_type: role },
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
})

router.post('/login', async (req, res) => {

    try {
        const {email, password} = req.body;

        if (!email || !password) return res.status(400).json({ message: 'email and password are required' });

        const [rows] = await pool.query('select * from app_user where email = ? limit 1', [email]);

        /*
        rows = [
            {
                user_id: 10,
                first_name: 'Sanowar',
                last_name: 'Hossen',
                email: 'Sanowar@example.com',
                password_hash: '$2b$10$QiiD9mIHEXEYUGhH0e01Rul.lIGWbW8tSinHsoKh9Ac4isVXas6NS',
                date_of_birth: null,
                country: null,
                division: null,
                city: null,
                district: null,
                street: null,
                post_code: null,
                gender: null,
                age: null,
                last_login: null,
                refresh_token: 'eyJhbGciOiJIUzIqiQLdHweykcP9U...',
                profile_picture: null,
                preferred_language: null,
                account_type: 'patient',
                specialization: null,
                reputation: 0,
                created_at: 2025-08-19T19:20:50.000Z,
                updated_at: 2025-08-19T19:20:50.000Z,
                phone_number: 1234567
            }
        ]
        */

        if (!rows.length) return res.status(401).json({ message: 'Invalid credentials' });


        const user = rows[0];
        const exact = await bcrypt.compare(password, user.password_hash);
        if (!exact) return res.status(401).json({ message: 'Invalid credentials' });

        await pool.query('update app_user set last_login= NOW() where user_id=?', [user.user_id]);

        const accessToken = signAccessToken({ user_id: user.user_id, account_type: user.account_type });
        const refreshToken = signRefreshToken({ user_id: user.user_id, account_type: user.account_type });


        await pool.query('UPDATE app_user SET refresh_token = ? WHERE user_id = ?', [refreshToken, user.user_id]);


        return res.json({
        message: 'Logged in',
        accessToken,
        refreshToken,
        user: {
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        account_type: user.account_type,
        },
        });
    } catch (error) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
        
    }
})


router.get('/me', authentication, async (req, res) => {
    try {
        const [rows] = await pool.query(
        'SELECT user_id, first_name, last_name, email, account_type, last_login, created_at, updated_at FROM app_user WHERE user_id = ? LIMIT 1',
        [req.user.user_id]
        );
        if (!rows.length) return res.status(404).json({ message: 'User not found' });
        return res.json(rows[0]);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
});



router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ message: 'refreshToken required' });

        const decoded = verifyRefreshToken(refreshToken);


        const [rows] = await pool.query('SELECT user_id, account_type, refresh_token FROM app_user WHERE user_id = ? LIMIT 1', [decoded.user_id]);
        if (!rows.length) return res.status(401).json({ message: 'Invalid refresh' });
        const user = rows[0];


        if (user.refresh_token !== refreshToken) {
        return res.status(401).json({ message: 'Refresh token no longer valid' });
        }



        const newAccess = signAccessToken({ user_id: user.user_id, account_type: user.account_type });
        const newRefresh = signRefreshToken({ user_id: user.user_id, account_type: user.account_type });

        await pool.query('UPDATE app_user SET refresh_token = ? WHERE user_id = ?', [newRefresh, user.user_id]);


        return res.json({ accessToken: newAccess, refreshToken: newRefresh });
    } catch (err) {
        console.error(err);
        return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
});


// not required for now
router.post('/logout', async (req, res) => {
try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'refreshToken required' });

    try {
        const decoded = verifyRefreshToken(refreshToken);
        await pool.query('UPDATE app_user SET refresh_token = NULL WHERE user_id = ? AND refresh_token = ?', [decoded.user_id, refreshToken]);
    } catch (error) {
        console.log(error);
    }


    return res.json({ message: 'Logged out' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;