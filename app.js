const express = require('express');
const app = express();

const productRouter = require('./API/Routes/Products');
const orderRouter = require('./API/Routes/Order');


app.use('/products', productRouter);
app.use('/orders', orderRouter);

module.exports = app;