const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');
const requireAuth = require('../middleware/authGuard');


// POST auth/signUp
router.post("/signup", async (req, res) => {
    const { email, password } = req.body;

    if( !email || !password) {
        return res.status(400).json({ error: "Email and password are required!"});
    }

    try{
        const { data, error} = await supabase.auth.signUp({ email, password});

        if(error) {
            return res.status(400).json({ error: error.message});
        }

        res.status(201).json(data.user);
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong during signup!"});
    }
});

//POST /auth/login
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    
    if( !email || !password){
        return res.status(400).json({ error: "Email and password are required!"});
    }

    try{
        const { data, error } = await supabase.auth.signInWithPassword({ email, password});

        if(error) {
            return res.status(401).json({ error: "Invalid login credentials!"});
        }

        res.status(200).json({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
        });
    }catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong during login!"});
    }
});

router.post("/logout", requireAuth, async (req, res) => {
    try {
        const { error } = await supabase.auth.signOut();

        if(error) {
            return res.status(500).json({ error: "Something went wrong during logout!"});
        }
        
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong during logout!"});
    }
});
module.exports = router;