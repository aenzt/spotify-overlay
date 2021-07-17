const express = require('express');

const router = express.Router();

//X
router.get('/', (req, res) => {
    res.send("Go")
});


module.exports = router;