const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const reviewRoutes = require("./routes/review.routes")
const viewdoctors  = require("./routes/viewdoctor")
const reportRoutes = require('./routes/report.routes');



const app = express();
app.use(cors());
app.use(express.json());


app.use('/api/auth', authRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/doctor', viewdoctors);
app.use('/api/report', reportRoutes);


const PORT = process.env.PORT;


app.listen(PORT, () => console.log(`Server started!!! http://localhost:${PORT}`));

