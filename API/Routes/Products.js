const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");
const fs = require("fs").promises;
const checkAuth = require('../middleware/check-auth');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, new Date().toISOString() + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1280 * 1280 * 5,
  },
  fileFilter: fileFilter,
});

const Product = require("../models/product");

// Get all products
router.get("/", async (req, res) => {
  try {
    const docs = await Product.find()
      .select("name price _id productImage")
      .exec();

    const response = {
      count: docs.length,
      products: docs.map((doc) => ({
        name: doc.name,
        price: doc.price,
        _id: doc._id,
        productImage: doc.productImage,
        links: [
          {
            rel: "self",
            method: "GET",
            href: `${process.env.BASE_URL}/products/${doc._id}`,
          },
        ],
      })),
    };

    res.status(200).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Create a new product
router.post("/", upload.single("productImage"), checkAuth, async (req, res) => {
  try {
    const product = new Product({
      _id: new mongoose.Types.ObjectId(),
      name: req.body.name,
      price: req.body.price,
      productImage: req.file.path
    });
    const result = await product.save();

    res.status(201).json({
      message: "Created product successfully",
      createdProduct: {
        name: result.name,
        price: result.price,
        _id: result._id,
        productImage: result.productImage,
        links: [
          {
            rel: "self",
            method: "GET",
            href: `${process.env.BASE_URL}/products/${result._id}`,
          },
        ],
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get a specific product by ID
router.get("/:productId", async (req, res) => {
  try {
    const id = req.params.productId;
    const doc = await Product.findById(id)
      .select("name price _id productImage")
      .exec();

    if (doc) {
      res.status(200).json({
        product: doc,
        links: [
          {
            rel: "all_products",
            method: "GET",
            href: `${process.env.BASE_URL}/products`,
          },
        ],
      });
    } else {
      res.status(404).json({ message: "No valid entry found for provided ID" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update a specific product by ID
router.patch("/:productId", async (req, res) => {
  try {
    const id = req.params.productId;
    const updateOps = {};
    for (const ops of req.body) {
      updateOps[ops.propName] = ops.value;
    }

    await Product.updateOne({ _id: id }, { $set: updateOps }).exec();

    res.status(200).json({
      message: "Product updated",
      request: {
        type: "GET",
        url: `${process.env.BASE_URL}/products/` + id,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete a specific product by ID
router.delete("/:productId", async (req, res) => {
  try {
    const id = req.params.productId;

    const product = await Product.findById(id).select("productImage").exec();

    if (!product) {
      return res.status(404).json({ message: "No valid entry found for provided ID" });
    }

    await Product.deleteOne({ _id: id }).exec();

    await fs.unlink(product.productImage);

    res.status(200).json({
      message: "Product deleted",
      links: [
        {
          rel: "create_product",
          method: "POST",
          href: `${process.env.BASE_URL}/products/`,
          description: "Create a new product",
          body: {
            name: "String",
            price: "Number",
            productImage: "Image",
          },
        },
      ],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
