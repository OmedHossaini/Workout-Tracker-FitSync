const express = require('express');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const router = express.Router();

const { MONGO_URI } = process.env;

const mongoOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
};

router.post('/log-weight', async (req, res) => {
    const { email, date, weight } = req.body;

    let client;

    try {
        client = new MongoClient(MONGO_URI, mongoOptions);
        await client.connect();
        const db = client.db('bycrpt');
        const accountsCollection = db.collection('accounts');

        const existingUser = await accountsCollection.findOne({ _id: email });

        if (!existingUser) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const newWeightLog = { date, weight };

        await accountsCollection.updateOne(
            { _id: email },
            { $push: { 'profile.weightLogs': newWeightLog } }
        );

        const updatedUserData = await accountsCollection.findOne({ _id: email });

        return res.status(201).json({
            status: 201,
            message: 'Weight logged successfully',
            user: updatedUserData,
        });
    } catch (err) {
        console.error('Error logging weight:', err.stack);
        return res.status(500).json({
            status: 500,
            message: 'Internal server error',
            error: err.message,
            stack: err.stack,
        });
    } finally {
        if (client) {
            await client.close();
        }
    }
});

router.get('/weight-logs/:email', async (req, res) => {
    const { email } = req.params;

    let client;

    try {
        client = new MongoClient(MONGO_URI, mongoOptions);
        await client.connect();
        const db = client.db('bycrpt');
        const accountsCollection = db.collection('accounts');

        const user = await accountsCollection.findOne({ _id: email });

        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const weightLogs = user.profile?.weightLogs || [];

        res.status(200).json({ status: 200, weightLogs });
    } catch (error) {
        console.error('Error fetching weight logs:', error.message);
        res.status(500).json({ status: 500, message: 'Internal server error', error: error.message });
    } finally {
        if (client) {
            await client.close();
        }
    }
});

module.exports = router;
