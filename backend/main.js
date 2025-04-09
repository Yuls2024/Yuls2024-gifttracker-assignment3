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

//Works - Get all people who are not eliminated
// Displays first & last name and relationship type
// app.get('/v1/people', (req, res) => {
//     const query = `
//       SELECT f_name, l_name, relationship
//       FROM people
//       WHERE eliminated = 0
//       ORDER BY person_id
//     `;

//     pool.query(query, (err, results) => {
//         if (err) {
//             return res.status(500).json({ status: 'error', error: err });
//         }

//         res.json({ status: 'success', data: results });
//     });
// });

//Displays all people who haven't been deleted
app.get('/v1/people', (req, res) => {
  const query = `
    SELECT f_name, l_name, relationship
    FROM people
    WHERE eliminated = 0
    ORDER BY person_id
  `;

  pool.query(query, (err, results) => {
      if (err) {
          return res.status(500).json({ status: 'error', error: err });
      }

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

  const searchPattern = `${name.toLowerCase()}%`;

  const query = `
      SELECT f_name, l_name, relationship, phone, email
      FROM people
      WHERE eliminated = 0 AND (
          LOWER(f_name) LIKE ? OR LOWER(l_name) LIKE ?
      )
      ORDER BY f_name ASC
  `;

  pool.query(query, [searchPattern, searchPattern], (err, results) => {
      if (err) {
          console.error("❌ SQL error:", err);
          return res.status(500).json({ status: 'error', error: err });
      }

      if (results.length === 0) {
          return res.status(404).json({
              status: 'error',
              message: 'No matching non-eliminated people found'
          });
      }

      res.json({
          status: 'success',
          data: results
      });
  });
});
  


// Works - Get one person by ID
// Displays all info for a person with a specific ID without eliminated being shown
app.get('/v1/people/:id', (req, res) => {
  const { id } = req.params;
  const query = `
      SELECT person_id, f_name, l_name, relationship, phone, email
      FROM people
      WHERE person_id = ?
  `;
  pool.query(query, [id], (err, results) => {
      if (err) {
          return res.status(500).json({ status: 'error', error: err });
      }
      if (results.length === 0) {
          return res.status(404).json({ status: 'error', message: 'Person not found' });
      }
      res.json({ status: 'success', data: results[0] });
  });
});


// Works - Add a new person
// Tested through Hoppscotch
// app.post('/v1/people', (req, res) => {
//     const { f_name, l_name, relationship, phone, email } = req.body;
//     const query = `INSERT INTO people (f_name, l_name, relationship, phone, email) VALUES (?, ?, ?, ?, ?)`;
//     const values = [f_name, l_name, relationship, phone, email];
//     pool.query(query, values, (err) => {
//         if (err) return res.status(500).json({ status: 'error', error: err });
//         res.json({ status: 'success', message: 'New person added!' });
//     });
// });

app.post("/v1/people", (req, res) => {
  const { f_name, l_name, relationship, phone, email } = req.query;

  // Ensure all required fields are present
  if (!f_name || !l_name || !relationship || !phone || !email) {
    return res.status(400).json({ error: "All fields are required." });
  }

  const sql = `
    INSERT INTO people (f_name, l_name, relationship, phone, email, eliminated)
    VALUES (?, ?, ?, ?, ?, 0)
  `;

  pool.query(sql, [f_name, l_name, relationship, phone, email], (err, result) => {
    if (err) {
      console.error("DB Insert Error:", err);
      return res.status(500).json({ error: "Database insert failed" });
    }

    res.status(201).json({
      message: "Person added successfully",
      person: {
        person_id: result.insertId,
        f_name,
        l_name,
        relationship,
        phone,
        email
      },
    });
  });
});



// Works - Filter people by relationship
// Displays all info for that person
app.get('/v1/people/relationship/:type', (req, res) => {
  const { type } = req.params;
  const query = `
      SELECT f_name, l_name, relationship, phone, email
      FROM people
      WHERE relationship = ?
  `;
  pool.query(query, [type], (err, results) => {
      if (err) {
          return res.status(500).json({ status: 'error', error: err });
      }
      res.json({ status: 'success', data: results });
  });
});


// // ???? Works - Update a person's full info by name (first, last, or both)
// // ✅ Update a person's full info by matching both first and last name exactly (case-insensitive)
// app.put('/v1/people/update', (req, res) => {
//     const { f_name, l_name, relationship, phone, email } = req.body;
  
//     if (!f_name || !l_name) {
//       return res.status(400).json({
//         status: 'error',
//         message: "Missing 'f_name' or 'l_name' in request body"
//       });
//     }
  
//     const findQuery = `
//       SELECT person_id FROM people
//       WHERE LOWER(f_name) = ? AND LOWER(l_name) = ? AND eliminated = 0
//     `;
  
//     pool.query(findQuery, [f_name.toLowerCase(), l_name.toLowerCase()], (err, results) => {
//       if (err) {
//         console.error("❌ Find error:", err);
//         return res.status(500).json({ status: 'error', error: err });
//       }
  
//       if (results.length === 0) {
//         return res.status(404).json({
//           status: 'error',
//           message: "No exact match found for first and last name"
//         });
//       }
  
//       if (results.length > 1) {
//         return res.status(400).json({
//           status: 'error',
//           message: 'Multiple people found with the same first and last name — use person_id or update-by-info',
//           matches: results
//         });
//       }
  
//       const personId = results[0].person_id;
  
//       const updateQuery = `
//         UPDATE people
//         SET f_name = ?, l_name = ?, relationship = ?, phone = ?, email = ?
//         WHERE person_id = ?
//       `;
  
//       const updateValues = [f_name, l_name, relationship, phone, email, personId];
  
//       pool.query(updateQuery, updateValues, (err2) => {
//         if (err2) {
//           console.error("❌ Update error:", err2);
//           return res.status(500).json({ status: 'error', error: err2 });
//         }
  
//         res.json({
//           status: 'success',
//           message: `Person ${f_name} ${l_name} updated successfully`,
//           person_id: personId
//         });
//       });
//     });
//   });

app.put('/v1/people/update', (req, res) => {
  const { f_name, l_name, relationship, phone, email } = req.query; // ✅ using query params

  // Validate search keys
  if (!f_name || !l_name) {
    return res.status(400).json({
      status: 'error',
      message: "Missing 'f_name' or 'l_name' in query parameters"
    });
  }

  // Validate editable fields
  if (!relationship || !phone || !email) {
    return res.status(400).json({
      status: 'error',
      message: "Missing one or more required fields: relationship, phone, email"
    });
  }

  const findQuery = `
    SELECT person_id FROM people
    WHERE LOWER(f_name) = ? AND LOWER(l_name) = ? AND eliminated = 0
  `;

  pool.query(findQuery, [f_name.toLowerCase(), l_name.toLowerCase()], (err, results) => {
    if (err) {
      console.error("❌ Find error:", err);
      return res.status(500).json({ status: 'error', error: err });
    }

    if (results.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: "No exact match found for first and last name"
      });
    }

    if (results.length > 1) {
      return res.status(400).json({
        status: 'error',
        message: 'Multiple people found — please be more specific',
        matches: results
      });
    }

    const personId = results[0].person_id;

    const updateQuery = `
      UPDATE people
      SET relationship = ?, phone = ?, email = ?
      WHERE person_id = ?
    `;

    const updateValues = [relationship, phone, email, personId];

    pool.query(updateQuery, updateValues, (err2) => {
      if (err2) {
        console.error("❌ Update error:", err2);
        return res.status(500).json({ status: 'error', error: err2 });
      }

      res.json({
        status: 'success',
        message: `Person ${f_name} ${l_name} updated successfully`,
        person_id: personId,
        updated: { relationship, phone, email }
      });
    });
  });
});

  

  
  

// ✅ Update a person's full info by first name, last name, and relationship
app.put('/v1/people/update-by-info', (req, res) => {
    const { f_name, l_name, relationship, phone, email } = req.body;
  
    // Validate required fields
    if (!f_name || !l_name || !relationship || !phone || !email) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing one or more required fields: f_name, l_name, relationship, phone, email',
      });
    }
  
    const findQuery = `
      SELECT person_id FROM people
      WHERE LOWER(f_name) = ? AND LOWER(l_name) = ? AND LOWER(relationship) = ? AND eliminated = 0
    `;
  
    const values = [f_name.toLowerCase(), l_name.toLowerCase(), relationship.toLowerCase()];
  
    pool.query(findQuery, values, (err, results) => {
      if (err) {
        console.error("❌ Find error:", err);
        return res.status(500).json({ status: 'error', error: err });
      }
  
      if (results.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'No matching person found',
        });
      }
  
      if (results.length > 1) {
        return res.status(400).json({
          status: 'error',
          message: 'Multiple people matched — please use person_id for safe updates',
          matches: results,
        });
      }
  
      const personId = results[0].person_id;
  
      const updateQuery = `
        UPDATE people
        SET f_name = ?, l_name = ?, relationship = ?, phone = ?, email = ?
        WHERE person_id = ?
      `;
  
      const updateValues = [f_name, l_name, relationship, phone, email, personId];
  
      pool.query(updateQuery, updateValues, (err2) => {
        if (err2) {
          console.error("❌ Update error:", err2);
          return res.status(500).json({ status: 'error', error: err2 });
        }
  
        res.json({
          status: 'success',
          message: `Person ${f_name} ${l_name} (${relationship}) updated successfully`,
          person_id: personId,
        });
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
//Works
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

//OCCASIONS

// Works - Get list of all distinct occasion names (no dates or IDs)
// Displays just occasions names
app.get('/v1/occasions/names', (req, res) => {
    const query = `
      SELECT DISTINCT occasion_name
      FROM occasions
      ORDER BY occasion_name ASC
    `;

    pool.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ status: 'error', error: err });
        }

        // Convert array of objects to just an array of strings
        const names = results.map(row => row.occasion_name);
        res.json({ status: 'success', data: names });
    });
});

// Works - Get upcoming special occasions: date, occasion name, person's name
app.get('/v1/occasions/timeline', (req, res) => {
    const query = `
      SELECT 
        DATE_FORMAT(o.occasion_date, '%Y-%m-%d') AS occasion_date,
        o.occasion_name,
        CONCAT(p.f_name, ' ', p.l_name) AS person_name
      FROM occasions o
      JOIN people p ON o.person_id = p.person_id
      WHERE p.eliminated = 0
      ORDER BY o.occasion_date ASC
    `;

    pool.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ status: 'error', error: err });
        }

        res.json({ status: 'success', data: results });
    });
});

// Works - Add a new occasion — only for active (non-eliminated) person
app.post('/v1/occasions', (req, res) => {
    const { person_id, occasion_name, occasion_date } = req.body;

    if (!person_id || !occasion_name || !occasion_date) {
        return res.status(400).json({
            status: 'error',
            message: 'Missing person_id, occasion_name, or occasion_date'
        });
    }

    // First, verify the person exists and is not eliminated
    const checkQuery = `SELECT * FROM people WHERE person_id = ? AND eliminated = 0`;
    pool.query(checkQuery, [person_id], (err, results) => {
        if (err) {
            return res.status(500).json({ status: 'error', error: err });
        }

        if (results.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Person not found or has been eliminated'
            });
        }

        // If person is valid, insert the occasion
        const insertQuery = `
        INSERT INTO occasions (person_id, occasion_name, occasion_date)
        VALUES (?, ?, ?)
      `;
        const values = [person_id, occasion_name, occasion_date];

        pool.query(insertQuery, values, (insertErr) => {
            if (insertErr) {
                return res.status(500).json({ status: 'error', error: insertErr });
            }

            res.json({
                status: 'success',
                message: 'New occasion added!'
            });
        });
    });
});
