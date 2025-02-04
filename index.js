const express = require('express');
const app = express();
const snippets = require('./snippets');
const crypto = require('crypto');
require('dotenv').config();
const bcrypt = require('bcrypt');


// Encryption setup
const algorithm = 'aes-256-cbc';
const SECRET_KEY = process.env.SECRET_KEY; 
const IV_LENGTH = 16; // IV length for AES-256-CBC

// Validate SECRET_KEY
if (!SECRET_KEY) {
  throw new Error('SECRET_KEY is not defined in .env!');
}

app.use(express.json());
let nextId = snippets.length > 0 ? Math.max(...snippets.map(s => s.id)) + 1 : 1;

// Encrypt function
function encrypt(text) {
    try {
      const iv = crypto.randomBytes(IV_LENGTH); // gen a random IV
      const cipher = crypto.createCipheriv(algorithm, Buffer.from(SECRET_KEY), iv);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return iv.toString('hex') + ':' + encrypted; // store IV with encrypted data
    } catch (error) {
      console.error('Encryption error:', error.message);
      return null;
    }
  }
  
  // Decrypt function
  function decrypt(encryptedText) {
    try {
      const parts = encryptedText.split(':');
      if (parts.length !== 2) {
        throw new Error('Invalid encrypted text format');
      }
  
      const iv = Buffer.from(parts[0], 'hex'); // Convert IV from hex to buffer
      const encryptedData = parts[1]; // Extract encrypted data
  
      const decipher = crypto.createDecipheriv(algorithm, Buffer.from(SECRET_KEY), iv);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error.message);
      return null;
    }
  }

// POST route
app.post('/snippets', (req, res) => {
  const { language, code } = req.body;

  if (!language || !code) {
    return res.status(400).json({ error: 'Language and code are required!' });
  }

  const encryptedCode = encrypt(code);
  if (!encryptedCode) {
    return res.status(500).json({ error: 'Failed to encrypt code' });
  }

  const newSnippet = {
    id: nextId++,
    language,
    code: encryptedCode,
  };

  snippets.push(newSnippet);
  res.status(201).json(newSnippet);
});

// GET routes 
app.get('/snippets', (req, res) => {
  const decryptedSnippets = snippets.map(s => ({
    ...s,
    code: decrypt(s.code) || 'Failed to decrypt code',
  }));
  res.json(decryptedSnippets);
});

app.get('/snippets/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const snippet = snippets.find(s => s.id === id);

  if (!snippet) {
    return res.status(404).json({ error: 'Snippet not found' });
  }

  res.json({
    ...snippet,
    code: decrypt(snippet.code) || 'Failed to decrypt code',
  });
});


//user registration route 
const users = []; // Temporary in-memory store

app.post('/users', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required!' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds); // Hash password

    const newUser = { email, password: hashedPassword };
    users.push(newUser);

    res.status(201).json({ message: 'User registered successfully!' });
});






// Server setup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`); 
});