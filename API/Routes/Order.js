const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Order = require('../models/order');
const Product = require('../models/product');

router.get("/", (req, res, next) => {
    Order.find()
      .select("product quantity _id")
      .populate('product', 'name price')
      .exec()
      .then(docs => {
        const ordersResponse = {
          count: docs.length,
          orders: docs.map(doc => {
            return {
              orderId: doc._id,
              product: {
                productId: doc.product._id,
                name: doc.product.name,
                price: doc.product.price
              },
              quantity: doc.quantity,
              links: [
                {
                  rel: "self",
                  method: "GET",
                  href: `http://localhost:3000/orders/${doc._id}`
                }
              ]
            };
          })
        };
  
        res.status(200).json(ordersResponse);
      })
      .catch(err => {
        res.status(500).json({
          error: err.message || "Internal Server Error"
        });
      });
  });
  

  router.post("/", async (req, res, next) => {
    try {
      const product = await Product.findById(req.body.productId);
  
      if (!product) {
        return res.status(404).json({
          message: 'Product not found'
        });
      }
  
      const order = new Order({
        _id: new mongoose.Types.ObjectId(),
        quantity: req.body.quantity,
        product: req.body.productId
      });
  
      const result = await order.save();
  
      const orderResponse = {
        message: "Order stored",
        createdOrder: {
          orderId: result._id,
          product: {
            productId: result.product._id,
            name: product.name, // Include product details
            price: product.price
          },
          quantity: result.quantity
        },
        links: [
          {
            rel: "self",
            method: "GET",
            href: `http://localhost:3000/orders/${result._id}`
          }
        ]
      };
  
      res.status(201).json(orderResponse);
    } catch (err) {
      console.error(err);
      res.status(500).json({
        error: err.message || "Internal Server Error"
      });
    }
  });
  

  router.get("/:orderId", (req, res, next) => {
    Order.findById(req.params.orderId)
      .populate('product', 'name price')
      .exec()
      .then(order => {
        if (!order) {
          return res.status(404).json({
            message: "Order not found"
          });
        }
  
        const orderResponse = {
          orderId: order._id,
          quantity: order.quantity,
          product: {
            productId: order.product._id,
            name: order.product.name,
            price: order.product.price
          },
          links: [
            {
              rel: "self",
              method: "GET",
              href: `http://localhost:3000/orders/${order._id}`
            },
            {
              rel: "all_orders",
              method: "GET",
              href: "http://localhost:3000/orders"
            }
          ]
        };
  
        res.status(200).json(orderResponse);
      })
      .catch(err => {
        res.status(500).json({
          error: err.message || "Internal Server Error"
        });
      });
  });
  
  router.delete("/:orderId", async (req, res, next) => {
    try {
      const result = await Order.deleteOne({ _id: req.params.orderId });
  
      if (result.deletedCount === 0) {
        return res.status(404).json({
          message: "Order not found"
        });
      }
  
      res.status(200).json({
        message: "Order deleted",
        links: [
          {
            rel: "create_order",
            method: "POST",
            href: "http://localhost:3000/orders",
            description: "Create a new order",
            body: { productId: "ID", quantity: "Number" }
          },
          {
            rel: "get_all_orders",
            method: "GET",
            href: "http://localhost:3000/orders",
            description: "Get all orders"
          }
        ]
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        error: err.message || "Internal Server Error"
      });
    }
  });
  

// testing the nodemon
module.exports = router;