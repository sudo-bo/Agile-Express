const express = require('express');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const { Post } = require('../models');
const auth = require('../middleware/auth');
const router = express.Router();

require('dotenv').config();

// Initialize Google Cloud Storage
const storage = new Storage({ keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS });
const bucket = storage.bucket(process.env.GCP_BUCKET_NAME);

// Set up Multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Post creation route
router.post('/create', auth, upload.single('photo'), async (req, res) => {
    const { description } = req.body;
    const { file } = req;
    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const blob = bucket.file(file.originalname);
    const blobStream = blob.createWriteStream({
        resumable: false,
    });

    blobStream.on('error', (err) => {
        res.status(500).json({ error: err.message });
    });

    blobStream.on('finish', async () => {
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        try {
            const post = await Post.create({
                description,
                photo: publicUrl,
                userId: req.user.id,
            });
            res.status(201).json(post);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    blobStream.end(file.buffer);
});

module.exports = router;
