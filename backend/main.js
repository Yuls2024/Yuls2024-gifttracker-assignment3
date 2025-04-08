const mysql = require('mysql2');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
// require('dotenv').config({ path: '../.env' }); // Loads DB config

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

console.log("🧪 ENV HOSTNAME:", process.env.SQL_HOSTNAME);


const app = express();
const port = 3001;

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.SQL_HOSTNAME,
  user: process.env.SQL_USERNAME,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DBNAME,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('json spaces', 2);

// CORS headers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  next();
});

// Root
app.listen(port, () => {
  console.log(`✅ GiftTracker API running on port ${port}`);
});

// Root route
app.get('/', (req, res) => {
  res.json({ info: 'Try /v1/' });
});

app.get('/v1/', (req, res) => {
  res.json({ info: 'GiftTracker API — built by Yulia!' });
});


// ================= PEOPLE =================

// Works - Get all people
// Displays first & last name and relationship type
app.get('/v1/people', (req, res) => {
  const query = `SELECT f_name, l_name, relationship FROM people ORDER BY person_id`;
  pool.query(query, (err, results) => {
    if (err) return res.status(500).json({ status: 'error', error: err });
    res.json({ status: 'success', data: results });
  });
});

// Works - Search people by name (partial, case-insensitive match on first or last name)
// Displays people who have their first or last name start with a certain letter or letters
app.get('/v1/people/search', (req, res) => {
    const { name } = req.query;
  
    if (!name || name.trim() === '') {
      return res.status(400).json({
        status: 'error',
        message: "Missing or empty 'name' query parameter"
      });
    }
  
    const search = `${name.toLowerCase()}%`;
  
    const query = `
      SELECT * FROM people
      WHERE LOWER(f_name) LIKE ? OR LOWER(l_name) LIKE ?
      ORDER BY f_name ASC
    `;
  
    pool.query(query, [search, search], (err, results) => {
      if (err) {
        console.error('❌ Search error:', err);
        return res.status(500).json({ status: 'error', error: err });
      }
  
      res.json({ status: 'success', data: results });
    });
  });
  

// Works - Get one person by ID
// Displays all info for a person with a specific ID
app.get('/v1/people/:id', (req, res) => {
  const { id } = req.params;
  pool.query('SELECT * FROM people WHERE person_id = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ status: 'error', error: err });
    if (results.length === 0) return res.status(404).json({ status: 'error', message: 'Person not found' });
    res.json({ status: 'success', data: results[0] });
  });
});

// Works - Add a new person
// Tested through Hoppscotch
app.post('/v1/people', (req, res) => {
  const { f_name, l_name, relationship, phone, email } = req.body;
  const query = `INSERT INTO people (f_name, l_name, relationship, phone, email) VALUES (?, ?, ?, ?, ?)`;
  const values = [f_name, l_name, relationship, phone, email];
  pool.query(query, values, (err) => {
    if (err) return res.status(500).json({ status: 'error', error: err });
    res.json({ status: 'success', message: 'New person added!' });
  });
});


// Works - Filter people by relationship
// Displays all info for that person
app.get('/v1/people/relationship/:type', (req, res) => {
  const { type } = req.params;
  pool.query('SELECT * FROM people WHERE relationship = ?', [type], (err, results) => {
    if (err) return res.status(500).json({ status: 'error', error: err });
    res.json({ status: 'success', data: results });
  });
});

// ???? Works - Update a person's full info by name (first, last, or both)
app.put('/v1/people/update', (req, res) => {
    const { name } = req.query;
    const { f_name, l_name, relationship, phone, email } = req.body;
  
    if (!name || name.trim() === '') {
      return res.status(400).json({ status: 'error', message: "Missing or empty 'name' query parameter" });
    }
  
    const search = `%${name.toLowerCase()}%`;
  
    // Find matching people first
    const findQuery = `
      SELECT person_id FROM people
      WHERE LOWER(CONCAT(f_name, ' ', l_name)) LIKE ? 
         OR LOWER(f_name) LIKE ? 
         OR LOWER(l_name) LIKE ?
    `;
  
    pool.query(findQuery, [search, search, search], (err, results) => {
      if (err) {
        console.error("❌ Find error:", err);
        return res.status(500).json({ status: 'error', error: err });
      }
  
      if (results.length === 0) {
        return res.status(404).json({ status: 'error', message: "Person not found" });
      }
  
      if (results.length > 1) {
        return res.status(400).json({
          status: 'error',
          message: 'Multiple people matched that name — be more specific',
          matches: results
        });
      }
  
      const personId = results[0].person_id;
  
      const updateQuery = `
        UPDATE people
        SET f_name = ?, l_name = ?, relationship = ?, phone = ?, email = ?
        WHERE person_id = ?
      `;
  
      const values = [f_name, l_name, relationship, phone, email, personId];
  
      pool.query(updateQuery, values, (err2) => {
        if (err2) {
          console.error("❌ Update error:", err2);
          return res.status(500).json({ status: 'error', error: err2 });
        }
  
        res.json({ status: 'success', message: 'Person updated successfully!' });
      });
    });
  });

  // ✅ Update a person's full info by matching both first and last name exactly (case-insensitive)
app.put('/v1/people/update', (req, res) => {
    const { f_name, l_name, relationship, phone, email } = req.body;
  
    if (!f_name || !l_name) {
      return res.status(400).json({
        status: 'error',
        message: "Missing 'f_name' or 'l_name' in request body"
      });
    }
  
    const findQuery = `
      SELECT person_id FROM people
      WHERE LOWER(f_name) = ? AND LOWER(l_name) = ?
    `;
  
    pool.query(findQuery, [f_name.toLowerCase(), l_name.toLowerCase()], (err, results) => {
      if (err) {
        console.error("❌ Find error:", err);
        return res.status(500).json({ status: 'error', error: err });
      }
  
      if (results.length === 0) {
        return res.status(404).json({ status: 'error', message: "Person not found with exact first and last name" });
      }
  
      if (results.length > 1) {
        return res.status(400).json({
          status: 'error',
          message: 'Multiple people found with this first and last name — cannot update safely',
          matches: results
        });
      }
  
      const personId = results[0].person_id;
  
      const updateQuery = `
        UPDATE people
        SET f_name = ?, l_name = ?, relationship = ?, phone = ?, email = ?
        WHERE person_id = ?
      `;
  
      const values = [f_name, l_name, relationship, phone, email, personId];
  
      pool.query(updateQuery, values, (err2) => {
        if (err2) {
          console.error("❌ Update error:", err2);
          return res.status(500).json({ status: 'error', error: err2 });
        }
  
        res.json({ status: 'success', message: 'Person updated successfully!' });
      });
    });
  });
  

  // 🗑️ Soft-delete a person by name and relationship
  //???
app.put('/v1/people/eliminate-by-info', (req, res) => {
    const { f_name, l_name, relationship } = req.body;
  
    if (!f_name || !l_name || !relationship) {
      return res.status(400).json({
        status: 'error',
        message: "Missing 'f_name', 'l_name', or 'relationship' in request body"
      });
    }
  
    const findQuery = `
      SELECT person_id FROM people
      WHERE LOWER(f_name) = ? AND LOWER(l_name) = ? AND LOWER(relationship) = ? AND eliminated = 0
    `;
  
    const params = [
      f_name.toLowerCase(),
      l_name.toLowerCase(),
      relationship.toLowerCase()
    ];
  
    pool.query(findQuery, params, (err, results) => {
      if (err) return res.status(500).json({ status: 'error', error: err });
  
      if (results.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Person not found or already eliminated'
        });
      }
  
      if (results.length > 1) {
        return res.status(400).json({
          status: 'error',
          message: 'Multiple people matched — please provide person_id to eliminate safely',
          matches: results
        });
      }
  
      const personId = results[0].person_id;
  
      const updateQuery = `UPDATE people SET eliminated = 1 WHERE person_id = ?`;
  
      pool.query(updateQuery, [personId], (err2) => {
        if (err2) return res.status(500).json({ status: 'error', error: err2 });
  
        res.json({
          status: 'success',
          message: `Person ${f_name} ${l_name} (${relationship}) marked as eliminated`,
          person_id: personId
        });
      });
    });
  });
  
  
  

// ================= GIFTS =================

// Works - Get all gifts (summary)
// Displays a list of Gifts by Name & Description
app.get('/v1/gifts', (req, res) => {
  const query = `SELECT gift_name, gift_description FROM gifts ORDER BY gift_id DESC`;
  pool.query(query, (err, results) => {
    if (err) return res.status(500).json({ status: 'error', error: err });
    res.json({ status: 'success', data: results });
  });
});

// Works - Get full gift details by ID with correctly ordered occasion fields
// Displays full gift details for a specific gift, including whom it was given to or planned to be given & feedback 
app.get('/v1/gifts/:id', (req, res) => {
    const giftId = parseInt(req.params.id, 10);
    if (isNaN(giftId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid gift ID' });
    }
  
    const query = `
      SELECT 
        gifts.gift_id,
        gifts.gift_name,
        gifts.gift_description,
        gifts.approx_gift_price,
        gifts.status,
        gifts.feedback,
        occasions.occasion_name,
        DATE_FORMAT(occasions.occasion_date, '%Y-%m-%d') AS occasion_date,
        people.f_name AS first_name,
        people.l_name AS last_name
      FROM gifts
      JOIN occasions ON gifts.occasion_id = occasions.occasion_id
      JOIN people ON occasions.person_id = people.person_id
      WHERE gifts.gift_id = ?
    `;
  
    pool.query(query, [giftId], (err, results) => {
      if (err) {
        return res.status(500).json({ status: 'error', error: err });
      }
  
      if (results.length === 0) {
        return res.status(404).json({ status: 'error', message: 'Gift not found' });
      }
  
      const gift = results[0];
  
      res.json({
        status: 'success',
        data: {
          gift_id: gift.gift_id,
          gift_name: gift.gift_name,
          gift_description: gift.gift_description,
          approx_gift_price: gift.approx_gift_price,
          status: gift.status,
          occasion: {
            date: gift.occasion_date,
            name: gift.occasion_name
          },
          recipient: {
            first_name: gift.first_name,
            last_name: gift.last_name
          },
          feedback: gift.feedback
        }
      });
    });
  });
  

// Works - Add a gift
app.post('/v1/gifts', (req, res) => {
  const { occasion_id, gift_name, gift_description, approx_gift_price, status, feedback } = req.body;
  const query = `
    INSERT INTO gifts (occasion_id, gift_name, gift_description, approx_gift_price, status, feedback)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const values = [occasion_id, gift_name, gift_description, approx_gift_price, status, feedback];
  pool.query(query, values, (err) => {
    if (err) return res.status(500).json({ status: 'error', error: err });
    res.json({ status: 'success', message: 'Gift added!' });
  });
});

// Works - Update gift
app.put('/v1/gifts/:id', (req, res) => {
  const giftId = parseInt(req.params.id, 10);
  if (isNaN(giftId)) return res.status(400).json({ status: 'error', message: 'Invalid gift ID' });

  const { gift_name, gift_description, approx_gift_price, status, feedback } = req.body;
  const query = `
    UPDATE gifts SET
      gift_name = ?, gift_description = ?, approx_gift_price = ?, status = ?, feedback = ?
    WHERE gift_id = ?
  `;
  const values = [gift_name, gift_description || null, approx_gift_price || null, status, feedback ?? null, giftId];

  pool.query(query, values, (err, result) => {
    if (err) return res.status(500).json({ status: 'error', error: err });
    if (result.affectedRows === 0) return res.status(404).json({ status: 'error', message: 'Gift not found' });
    res.json({ status: 'success', message: 'Gift updated successfully!' });
  });
});
