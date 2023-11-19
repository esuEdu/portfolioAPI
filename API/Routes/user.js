const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken"); 

const User = require("../models/user");

router.post("/signup", async (req, res) => {
    try {
        const existingUser = await User.findOne({ email: req.body.email }).exec();

        if (existingUser) {
            return res.status(409).json({ message: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const newUser = new User({
            _id: new mongoose.Types.ObjectId(),
            email: req.body.email,
            password: hashedPassword,
        });

        await newUser.save();

        res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).exec();

        if (!user) {
            return res.status(401).json({ message: "Authentication failed. Invalid email or password." });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: "Authentication failed. Invalid email or password." });
        }

        // Create and sign a JWT token
        jwt.sign(
            {
                userId: user._id,
                email: user.email
            },
            process.env.MONGO_ATLAS_PW, // Use a more generic name like JWT_SECRET
            {
                expiresIn: '1h' // Adjust the expiry time as needed
            },
            function(err, token){
                if (err) {
                    console.error(err);
                    res.status(500).json({ error: "Internal Server Error" });
                } else {
                    // Send the token in the response
                    res.status(200).json({
                        message: 'Authentication successful',
                        token: token
                    });
                }
            }
        );
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});




router.delete('/:userId', async (req, res) => {
    try {
        const result = await User.deleteOne({ _id: req.params.userId }).exec();

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



// testing the nodemon
module.exports = router;
