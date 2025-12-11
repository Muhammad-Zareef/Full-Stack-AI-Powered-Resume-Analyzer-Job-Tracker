
const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/verifyToken');
const { getJobs, addJob, updateJob, deleteJob } = require('../controllers/jobController');

router.get('/jobs', verifyToken, getJobs);
router.post('/jobs', verifyToken, addJob);
router.put('/jobs/:id', verifyToken, updateJob);
router.delete('/jobs/:id', verifyToken, deleteJob);

module.exports = router;
