require('dotenv').config;
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function initDb() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        done BOOLEAN DEFAULT false)`);

    const { rows } = await pool.query('SELECT COUNT(*) AS count FROM tasks');
    const count = Number(rows[0].count);

    if( count===0 ) {
        console.log('The table is empty. Seed tasks will be added!');
        await pool.query(`
            INSERT INTO tasks (title, done) VALUES
            ('Do grocery', true),
            ('Clean the house', false),
            ('Do internship assignments', false)
        `);
    } else {
        console.log(`The table already has ${count} rows!`);
        }
    }

    module.exports = { pool, initDb };