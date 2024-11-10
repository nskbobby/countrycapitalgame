import express from "express";
import bodyParser from "body-parser";
import { fileURLToPath } from "url";
import { dirname } from "path";
import pg from 'pg';
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const dircname = dirname(fileURLToPath(import.meta.url));


const db = new pg.Client({
    user:  process.env.DATABASE_USER,
    host:  process.env.DATABASE_HOST,
    database: process.env.DATABASE_NAME,
    password: process.env.DATABASE_PASSWORD,
    port: 5432
});

db.connect().then(() => console.log("Connected to database")).catch(err => console.error("Database connection error:", err));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(dircname + '/public'));

 let  currentCountry = await getRandomCountry("country","capitals","id",Math.floor(Math.random()*250));
let score = 0;


// Function to retrieve the capital of a given country from the database
async function getkeyvalue(table, key) {
    try {
        const res = await db.query(`SELECT capital FROM ${table} WHERE country = $1`, [key]);
        if (res.rows.length > 0) {
            return res.rows[0].capital;
        } else {
            console.error("No capital data found for the specified country.");
            return null;
        }
    } catch (err) {
        console.error("Database query error:", err);
        return null;
    }
}

async function getRandomCountry(row,table,keyname, key) {
    try {
        const res = await db.query(`SELECT ${row} FROM ${table} WHERE ${keyname} = $1`, [key]);
        if (res.rows.length > 0) {
            return res.rows[0].country;
        } else {
            console.error("No data found for the specified country.");
            return null;
        }
    } catch (err) {
        console.error("Database query error:", err);
        return null;
    }
}


// Render game page
app.get("/", (req, res) => {


    res.render(dircname + "/views/mainpages/gamepage.ejs", {
        country: currentCountry,
        score: score,
        message: null // No message on the first load
    });
});

// Handle answer submission
app.post('/submit-answer', async (req, res) => {
    const userAnswer = req.body.capital;
    const correctAnswer = await getkeyvalue("capitals", currentCountry);
    currentCountry = await getRandomCountry("country","capitals","id",Math.floor(Math.random()*250));
    if (correctAnswer && userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
        score++;
        res.render(dircname + "/views/mainpages/gamepage.ejs", {
            country: currentCountry,
            score: score,
            message: { type: 'correct', text: 'Correct! Well done!' }
        });
    } else {
        res.render(dircname + "/views/mainpages/gamepage.ejs", {
            country: currentCountry,
            score: score,
            message: { type: 'incorrect', text: 'Incorrect! Try again.' }
        });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
