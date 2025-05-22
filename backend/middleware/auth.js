const jwt = require('jsonwebtoken');

// A simple, insecure way to get a token for now. 
// In a real app, you'd have a proper login with hashed passwords.
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password'; // SET THIS IN .env!
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined. Please set it in your .env file.');
    process.exit(1);
}

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) return res.sendStatus(401); // if there isn't any token

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('JWT Verification Error:', err.message);
            return res.sendStatus(403); // invalid token
        }
        req.user = user; // Add user payload to request object
        next(); // pass the execution to the dramatic response
    });
};

// Login route handler (to be added to a new auth route file or directly in server.js for simplicity for now)
const login = (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        // In a real app, user would come from database
        const userPayload = { username: username, role: 'admin' }; 
        const accessToken = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '1h' }); // Token expires in 1 hour
        res.json({ accessToken: accessToken });
    } else {
        res.status(401).json({ error: 'Invalid username or password' });
    }
};

module.exports = {
    authenticateToken,
    login
}; 