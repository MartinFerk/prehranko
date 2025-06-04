const express = require('express');
const router = express.Router();
const Obrok = require('../models/Obrok'); // Adjust the path

// GET /api/obroki
router.get('/', async (req, res) => {
    try {
        const obroki = await Obrok.find();
        res.json(obroki);
    } catch (err) {
        res.status(500).json({ message: 'Napaka pri pridobivanju obrokov' });
    }
});

module.exports = router;
