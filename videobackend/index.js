const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();
const app = express();


const port = process.env.PORT || 4000;
app.use(cors({ origin: "*" }));

app.use(express.json());

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });


const auth = new google.auth.GoogleAuth({
    credentials: {
        type: process.env.GOOGLE_TYPE,
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_CLIENT_ID,
        auth_uri: process.env.GOOGLE_AUTH_URI,
        token_uri: process.env.GOOGLE_TOKEN_URI,
        auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_CERT_URL,
        client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT_URL,
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });
const FOLDER_ID = process.env.DRIVE_FOLDER_ID;


async function uploadToDrive(filePath, fileName) {
    const fileMetadata = {
        name: fileName,
        parents: [FOLDER_ID],
    };
    const media = {
        mimeType: 'video/mp4',
        body: require('fs').createReadStream(filePath),
    };
    const response = await drive.files.create({
        resource: fileMetadata,
        media,
        fields: 'id, webViewLink',
    });

    // Prevent download permissions
    await drive.permissions.create({
        fileId: response.data.id,
        requestBody: {
            role: 'reader',
            type: 'anyone',
        },
    });
    await drive.files.update({
        fileId: response.data.id,
        requestBody: {
            viewersCanCopyContent: false,
        },
    });

    return response.data;
}

app.post('/api/upload', upload.single('video'), async (req, res) => {
    try {
        const { path, originalname } = req.file;
        console.log(path, originalname);
        const video = await uploadToDrive(path, originalname);
        res.status(200).json(video);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error uploading video' });
    }
});



app.get('/api/videos', async (req, res) => {
    try {
        const response = await drive.files.list({
            q: `'${FOLDER_ID}' in parents`,
            fields: 'files(id, name, webViewLink)',
        });
        res.status(200).json(response.data.files);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching videos' });
    }
});




app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}
);
