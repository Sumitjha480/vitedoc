import express from 'express';
import session from 'express-session';
import mongoose from 'mongoose';
import multer from 'multer';
import mammoth from 'mammoth';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Document } from './models/document.js';
import { User } from './models/user.js';
import dotenv from 'dotenv';
import MongoStore from 'connect-mongo';
import htmlDocx from 'html-docx-js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://docmanager:docmanager123@cluster0.mongodb.net/docmanager?retryWrites=true&w=majority');
    console.log('MongoDB connected successfully');
    console.log(process.env.MONGODB_URI)
  } catch (err) {
    console.error('MongoDB connection error:', err);
    console.log('Using in-memory MongoDB for development');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
  }
};

connectDB();

app.use(express.static('public'));
app.use('/htmx', express.static('node_modules/htmx.org/dist'));
app.use('/vitedoc', express.static(join(__dirname, 'public/vitedoc')));
app.get('/vitedoc/*', (req, res) => {
  res.sendFile(join(__dirname, 'public/vitedoc/index.html'));
});
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Add this before your session middleware
const isProduction = process.env.NODE_ENV === 'production';
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'dev-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb+srv://docmanager:docmanager123@cluster0.mongodb.net/docmanager?retryWrites=true&w=majority',
    ttl: 24 * 60 * 60, // Session TTL (1 day)
    touchAfter: 24 * 3600 // Only update session once per 24 hours unless data changes
  }),
  cookie: {
    secure: isProduction, // false in development, true in production
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    httpOnly: true,
    sameSite: 'lax'
  },
  name: 'sessionId'
};

// Add this check for development environment
if (!isProduction) {
  // Allow sessions without HTTPS in development
  sessionConfig.cookie.secure = false;
}

app.use(session(sessionConfig));

// Add this after your session configuration
app.use((req, res, next) => {
  // Log session status (helpful during development)
  console.log('Session ID:', req.sessionID);
  console.log('Session User:', req.session.user);
  next();
});

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'application/msword' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
}).single('document');

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

// Add new endpoint to check session status
app.get('/check-session', (req, res) => {
  if (req.session && req.session.user) {
    res.json({ isAuthenticated: true });
  } else {
    res.json({ isAuthenticated: false });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    if (username === 'sumit' && password === 'qwerty123') {
      // Set session data
      req.session.user = {
        username,
        name: 'Sumit Kumar', 
        email: 'sumit@example.com',
        loginTime: new Date(),
        lastActive: new Date(),
      };

      // Save session explicitly
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({
            success: false,
            error: 'Session creation failed'
          });
        }

        res.json({
          success: true,
          html: `
            <div class="flex items-center space-x-4">
              <a href="/documents" class="text-gray-700 hover:text-gray-900">Document Manager</a>
              <a href="/chat" class="text-gray-700 hover:text-gray-900">Chat with Dikea</a>
              <a href="/user-info" class="bg-blue-500 text-white px-4 py-2 rounded">User Info</a>
            </div>
          `,
        });
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

const requireLogin = (req, res, next) => {
  if (!req.session || !req.session.user) {
    if (req.xhr) {
      return res.status(401).json({ error: 'Session expired' });
    }
    return res.redirect('/');
  }
  // Update last active timestamp
  req.session.user.lastActive = new Date();
  next();
};

// // Middleware to check if user is logged in
// const requireLogin = (req, res, next) => {
//   if (req.session && req.session.user) {
//     next();
//   } else {
//     res.redirect('/login');
//   }
// };


// Apply to protected routes
app.get('/documents', requireLogin, async (req, res) => {
  res.sendFile(join(__dirname, 'public', 'documents.html'));
});

app.get('/chat', requireLogin, (req, res) => {
  res.sendFile(join(__dirname, 'public', 'chat.html'));
});

app.get('/user-info', requireLogin, (req, res) => {
  res.sendFile(join(__dirname, 'public', 'user-info.html'));
});

// Add new DELETE endpoint for documents
app.delete('/api/documents/:id', requireLogin, async (req, res) => {
  try {
    const document = await Document.findByIdAndDelete(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Error deleting document' });
  }
});

app.post('/upload', (req, res) => {
  upload(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File size exceeds 15MB limit' });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(500).json({ error: 'Error uploading file' });
    }

    if (!req.session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded or invalid file type' });
    }

    const doc = new Document({
      name: req.file.originalname,
      content: req.file.buffer,
      type: req.file.mimetype,
    });

    doc.save()
      .then(() => res.json({ success: true }))
      .catch(error => {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Error saving file' });
      });
  });
});

app.get('/api/documents', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const documents = await Document.find({}, { content: 0 });
  res.json(documents);
});

app.get('/download-document/:id', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).send('Document not found');
    }

    // For HTML content (created in editor), convert to Word
    if (document.type === 'text/html' && document.richContent) {
      const docx = htmlDocx.asBlob(document.richContent);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${document.name}.docx"`);
      res.send(Buffer.from(await docx.arrayBuffer()));
      return;
    }

    // For existing Word documents, send as-is
    res.setHeader('Content-Type', document.type);
    res.setHeader('Content-Disposition', `attachment; filename="${document.name}"`);
    res.send(document.content);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).send('Error downloading document');
  }
});

// Add endpoint to get document for editing
app.get('/api/documents/:id/edit', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Convert Word documents to HTML
    if (document.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        document.type === 'application/msword') {
      const result = await mammoth.convertToHtml(document.content);
      return res.json({
        id: document._id,
        title: document.name,
        content: result.value,
        type: document.type
      });
    }

    // For other document types
    res.json({
      id: document._id,
      title: document.name,
      content: document.richContent || document.content,
      type: document.type
    });
  } catch (error) {
    console.error('Error getting document:', error);
    res.status(500).json({ error: 'Error getting document' });
  }
});

app.get('/view-document/:id', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).send('Document not found');
    }

    // For Word documents, redirect to ViteDoc editor
    if (document.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        document.type === 'application/msword') {
      return res.redirect(`/vitedoc/documents/edit/${document._id}`);
    }

    // Handle editor-created documents (HTML content)
    if (document.type === 'text/html' && document.richContent) {
      return res.redirect(`/vitedoc/documents/edit/${document._id}`);
      // res.send(`
      //   <!DOCTYPE html>
      //   <html>
      //   <head>
      //     <title>${document.name}</title>
      //     <style>
      //       body { 
      //         font-family: Arial, sans-serif;
      //         line-height: 1.6;
      //         margin: 2rem;
      //         max-width: 800px;
      //         margin: 0 auto;
      //         padding: 20px;
      //       }
      //     </style>
      //   </head>
      //   <body>
      //     ${document.richContent}
      //   </body>
      //   </html>
      // `);
      // return;
    }

    // Handle Word documents
    // if (document.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    //     document.type === 'application/msword') {
    //   const result = await mammoth.convertToHtml(document.content);
    //   res.send(`
    //     <!DOCTYPE html>
    //     <html>
    //     <head>
    //       <title>${document.name}</title>
    //       <style>
    //         body { 
    //           font-family: Arial, sans-serif;
    //           line-height: 1.6;
    //           margin: 2rem;
    //           max-width: 800px;
    //           margin: 0 auto;
    //           padding: 20px;
    //         }
    //       </style>
    //     </head>
    //     <body>
    //       ${result.value}
    //     </body>
    //     </html>
    //   `);
    //   return;
    // }

    // For other document types (like PDF), send as before
    res.setHeader('Content-Type', document.type);
    res.send(document.content);
  } catch (error) {
    console.error('Error viewing document:', error);
    res.status(500).send('Error viewing document');
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ success: false, error: 'Logout failed' });
    }
    res.json({ success: true });
  });
});

if (!isProduction) {
  app.get('/debug/session', (req, res) => {
    res.json({
      sessionID: req.sessionID,
      session: req.session,
      cookie: req.session.cookie,
    });
  });
}

// // New editor routes
// app.get('/editor', requireLogin, (req, res) => {
//     res.sendFile(join(__dirname, 'public', 'editor.html'));
//   });

// // Endpoint for saving editor documents
// app.post('/save-document', requireLogin, async (req, res) => {
//     try {
//       const { title, content } = req.body;
      
//       // Allow content without title for auto-saving
//       if (!content) {
//         return res.status(400).json({ error: 'Content is required' });
//       }
  
//       const document = new Document({
//         name: title || 'Untitled Document',
//         richContent: content,
//         type: 'text/html',
//         userId: req.session.user.username,
//         createdAt: new Date()
//       });
  
//       await document.save();
//       res.json({ success: true, documentId: document._id });
//     } catch (error) {
//       console.error('Error saving document:', error);
//       res.status(500).json({ error: 'Error saving document' });
//     }
//   });

// Handle saving vitedoc documents
app.post('/api/save-vitedoc', requireLogin, async (req, res) => {
  try {
    console.log('Received save request:', req.body);
    const { title, content } = req.body;
    console.log(req.body);
    
    if (!content) {
      console.log('Content missing in request');
      return res.status(400).json({ error: 'Content is required' });
    }

    const document = new Document({
      name: title || 'Untitled Document',
      richContent: content,
      type: 'text/html',
      userId: req.session.user.username,
      createdAt: new Date(),
      annotations: req.body.annotations || [],
    });

    const savedDoc = await document.save();
    console.log('Document saved successfully:', savedDoc._id);
    res.json({ success: true, documentId: savedDoc._id });
  } catch (error) {
    console.error('Error saving vitedoc document:', error);
    res.status(500).json({ error: 'Error saving document' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});