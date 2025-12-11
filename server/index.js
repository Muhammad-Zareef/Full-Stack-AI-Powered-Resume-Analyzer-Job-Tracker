
const express = require('express');
const app = express();
const connectDB = require('./config/db');
const fileUpload = require("express-fileupload");
const userRoutes = require('./routes/userRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const jobRoutes = require('./routes/jobRoutes');
const cookieParser = require('cookie-parser');
const path = require('path');
const cors = require('cors');
require("dotenv").config();

const PORT = process.env.PORT || 3000;

app.use(fileUpload());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:5501"],
    credentials: true,
}));

// connect to database
connectDB();

app.use('/api', userRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api', jobRoutes);

app.listen(PORT, () => {
    console.log("Server running");
});
