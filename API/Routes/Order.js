const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {

    res.status(200).json({message: 'Order were fatched'});

});

router.post('/', (req, res, next) => {

    res.status(201).json({message: 'Order was created'});

});

router.get('/:orderId', (req, res, next) => {

    res.status(200).json({
    message: 'Order Details',
    orderId: req.params.orderId
    });

});
  

router.delete('/:orderId', (req, res, next) => {

    res.status(200).json({message: 'Order was deleted'});

});


module.exports = router;