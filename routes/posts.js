const express = require('express');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const { Post } = require('../models');
const auth = require('../middleware/auth');
const router = express.Router();
const timeDifference = require('../utils/timeDifference'); 

require('dotenv').config();

// Initialize Google Cloud Storage
const storage = new Storage({ keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS });
const bucket = storage.bucket(process.env.GCP_BUCKET_NAME);

// Set up Multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 5 }, // 5MB limit per file, max 5 files
});

// Function to upload a single file to GCP
const uploadFileToGCP = async (file) => {
    return new Promise((resolve, reject) => {
        const blob = bucket.file(file.originalname);
        const blobStream = blob.createWriteStream({
            resumable: false,
        });

        blobStream.on('error', (err) => {
            reject(err);
        });

        blobStream.on('finish', () => {
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
            resolve(publicUrl);
        });

        blobStream.end(file.buffer);
    });
};

// Post creation route
router.post('/create', auth, upload.array('photos', 5), async (req, res) => {
    const { description } = req.body;
    const files = req.files;
    if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }

    try {
        const photoUrls = await Promise.all(files.map(file => uploadFileToGCP(file)));

        const post = await Post.create({
            description,
            photos: photoUrls, // Store as an array
            userId: req.user.id,
        });

        res.status(201).json(post);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Return posts with time difference
router.get('/', auth, async (req, res) => {
    try {
        const posts = await Post.findAll();
        const postsWithTimeDiff = posts.map(post => ({
            ...post.toJSON(),
            timeAgo: timeDifference(post.createdAt)
        }));
        res.status(200).json(postsWithTimeDiff);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update post description
router.put('/:id', auth, async (req, res) => {
    const { description } = req.body;
    const { id } = req.params;

    try {
        const post = await Post.findByPk(id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        if (post.userId !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        post.description = description;
        await post.save();
        res.status(200).json(post);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
