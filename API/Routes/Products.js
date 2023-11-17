const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {

    res.status(200).json({message: 'Handling GET request to /products.'});

});

router.post('/', (req, res, next) => {

    res.status(200).json({message: 'Handling POST request to /products.'});

});

router.get('/:ProductId', (req, res, next) => {

    const id = req.params.ProductId;

    if (id === 'special') {
    
        res.status(200).json({
            message: 'You discoved the special Id',
            id: id
        });
    
    }else {
        res.status(200).json({message: 'You passsed an special Id'});
    }
});


router.patch('/:ProductId', (req, res, next) => {

    res.status(200).json({message: 'update product'});

});

router.delete('/:ProductId', (req, res, next) => {

    res.status(200).json({message: 'delete product'});

});

module.exports = router;