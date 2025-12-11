
const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/verifyToken');
const { getResumes, analyzeResume, deleteResume, clearAllHistory, auth } = require('../controllers/resumeController');

router.get('/auth', verifyToken, auth);
router.get('/', verifyToken, getResumes);
router.post('/analyze', verifyToken, analyzeResume);
router.delete('/deleteResume/:id', verifyToken, deleteResume);
router.delete('/clearAllHistory', verifyToken, clearAllHistory);

module.exports = router;
