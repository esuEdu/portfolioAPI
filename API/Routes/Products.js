const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, new Date().toISOString() + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  //reject a file
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
router.get("/", (req, res, next) => {
  Product.find()
    .select("name price _id productImage")
    .exec()
    .then((docs) => {
      const response = {
        count: docs.length,
        products: docs.map((doc) => {
          return {
            name: doc.name,
            price: doc.price,
            _id: doc._id,
            productImage: doc.productImage,
            links: [
              {
                rel: "self",
                method: "GET",
                href: `http://localhost:3000/products/${doc._id}`,
              },
            ],
          };
        }),
      };
      res.status(200).json(response);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({
        error: err,
      });
    });
});

// Create a new product
router.post("/", upload.single("productImage"), (req, res, next) => {
  console.log(req.file);
  const product = new Product({
    _id: new mongoose.Types.ObjectId(),
    name: req.body.name,
    price: req.body.price,
    productImage: req.file.path,
  });

  product
    .save()
    .then((result) => {
      console.log(result);
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
              href: `http://localhost:3000/products/${result._id}`,
            },
          ],
        },
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({
        error: err,
      });
    });
});

// Get a specific product by ID
router.get("/:productId", (req, res, next) => {
  const id = req.params.productId;
  Product.findById(id)
    .select("name price _id productImage")
    .exec()
    .then((doc) => {
      console.log("From database", doc);
      if (doc) {
        res.status(200).json({
          product: doc,
          links: [
            {
              rel: "all_products",
              method: "GET",
              href: "http://localhost:3000/products",
            },
          ],
        });
      } else {
        res
          .status(404)
          .json({ message: "No valid entry found for provided ID" });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({
        error: err,
      });
    });
});

router.patch("/:productId", (req, res, next) => {
  console.log(req.file);
  const id = req.params.productId;
  const updateOps = {};
  for (const ops of req.body) {
    updateOps[ops.propName] = ops.value;
  }

  Product.updateOne({ _id: id }, { $set: updateOps })
    .exec()
    .then((result) => {
      res.status(200).json({
        message: "Product updated",
        request: {
          type: "GET",
          url: "http://localhost:3000/products/" + id,
        },
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});

// Delete a specific product by ID
router.delete("/:productId", (req, res, next) => {
  const id = req.params.productId;

  // First, fetch the product to get the image path
  Product.findById(id)
    .select("productImage")
    .exec()
    .then((product) => {
      if (!product) {
        return res
          .status(404)
          .json({ message: "No valid entry found for provided ID" });
      }

      // Delete the product document from the database
      Product.deleteOne({ _id: id })
        .exec()
        .then((result) => {
          // Delete the associated image file
          fs.unlink(product.productImage, (err) => {
            if (err) {
              console.error(err);
              return res
                .status(500)
                .json({ error: "Failed to delete image file" });
            }

            res.status(200).json({
              message: "Product deleted",
              links: [
                {
                  rel: "create_product",
                  method: "POST",
                  href: "http://localhost/3000/products/",
                  description: "Create a new product",
                  body: {
                    name: "String",
                    price: "Number",
                    productImage: "Image",
                  },
                },
              ],
            });
          });
        })
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({
        error: err,
      });
    });
});

module.exports = router;
