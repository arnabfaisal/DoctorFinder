const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');

const app = express();
app.use(cors());
app.use(express.json());

// Mount routes under a common prefix
app.use('/api/auth', authRoutes);


const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server started!!! http://localhost:${PORT}`));