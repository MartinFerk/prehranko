const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');

// Shrani novo aktivnost
router.post('/', async (req, res) => {
    const { activityId, userEmail, stats } = req.body;

    if (!activityId || !userEmail || !Array.isArray(stats)) {
        return res.status(400).json({ message: 'Manjkajoči podatki' });
    }

    try {
        const newActivity = new Activity({ activityId, userEmail, stats });
        await newActivity.save();
        res.status(201).json({ message: 'Aktivnost shranjena' });
    } catch (err) {
        console.error('❌ Napaka pri shranjevanju aktivnosti:', err);
        res.status(500).json({ message: 'Napaka na strežniku' });
    }
});

module.exports = router;
