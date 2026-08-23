import bcrypt from 'bcrypt';
import pool from '../config/db.js';
import validator from 'validator'
import { isPasswordStrong } from '../utils/validator.js';
import jwt from 'jsonwebtoken';


/* status refrence
==-==-==-==-==-==-==-==-==
Bad/missing input               -> 400
Not logged in / wrong password  -> 401
Logged in but not allowed       -> 403
Doesn't exist                   -> 404
Already exists / conflicts      -> 409
Everything else genuinely broke -> 500
*/



export const signup = async (req, res) => { // SIGN-UP CONTROLLER
    try {
        console.log('BODY:', req.body);
        console.log('HEADERS:', req.headers);

        const { username, email, password } = req.body;

        
        if (!username) {
            return res.status(400).json({ message: 'Please enter valid username' })
        }
        
        if (!email) {
            return res.status(400).json({ message: 'Please enter an E-mail' })
        }
        
        if (!validator.isEmail(email)) {
            return res.status(400).json({ message: 'Please enter a valid E-mail' })
        }
        
        if (!password) {
            return res.status(400).json({ message: 'Please enter the password' })
        }
        
        if (!isPasswordStrong(password)) { // funtion we called from validator.js
            return res.status(400).json({ message: 'Password must be at least 8 characters and include uppercase, lowercase, a number, and a symbol' });
        }
        
        const exisitingUser = await pool.query (
            'SELECT user_id FROM users WHERE email = $1' , [email]
        );

        if (exisitingUser.rows.length > 0) {
            return res.status(409).json({ message: 'User already exists' })
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1,$2,$3) RETURNING user_id, username, email, created_at', [username, email, hashedPassword]
        );

        res.status(201).json(result.rows[0]); // 201 for created user and its deatils
    }

    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Signup failed' });
    }
}

export const login = async (req, res) => { // LOGIN CONTROLLER
    try {
        console.log('BODY:', req.body);
        console.log('HEADERS:', req.headers);

        const { email, password } = req.body;
        if (!password) {
            return res.status(400).json({ message: 'Please enter the password' }) //IF PASSWORD NOT TYPED
        }

        if (!email) {
            return res.status(400).json({ message: 'Please enter an E-mail' }) // IF EMAIL NOT TYPED
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({ message: 'Enter a Valid E-mail' }) // EMAIL TYPED BUT NOT VALID
        }

        const result = await pool.query(
            'SELECT user_id, username,email,password_hash FROM users WHERE email = $1', [email]
        )
        const user = result.rows[0];

        // Check if user exist
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if password match
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect Password' }); // RETURN added so func stoppes here 
        }
        console.log('SECRET:', process.env.JWT_SECRET);
        const token = jwt.sign( 
            {used_id : user.user_id},
            process.env.JWT_SECRET,
            {expiresIn : '7d'}
        );


        res.status(200).json({ message: 'Login succesfull', token }); // 200 for succesfull login
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Login failed' });
    }

}