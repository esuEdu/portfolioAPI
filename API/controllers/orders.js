const Order = require("../models/order");

exports.orders_get_all = async (req, res) => {
  try {
    const docs = await Order.find()
      .select("product quantity _id")
      .populate("product", "name price")
      .exec();

    const ordersResponse = {
      count: docs.length,
      orders: docs.map((doc) => ({
        orderId: doc._id,
        product: {
          productId: doc.product._id,
          name: doc.product.name,
          price: doc.product.price,
        },
        quantity: doc.quantity,
        links: [
          {
            rel: "self",
            method: "GET",
            href: `${BASE_URL}/orders/${doc._id}`,
          },
        ],
      })),
    };

    res.status(200).json(ordersResponse);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
};

