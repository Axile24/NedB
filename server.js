


const express = require('express');
const Datastore = require('nedb-promises');
const app = express();
const port = 3000;

// Setup NeDB
const db = Datastore.create({
  filename: 'books.db',
  autoload: true
});

app.use(express.json());

// POST - Add books
app.post('/books', async (req, res) => {
  const books = req.body;
  if (!Array.isArray(books) || books.length === 0) {
    return res.status(400).json({ message: 'No books found or invalid format' });
  }

  try {
    const newDoc = await db.insert(books);
    res.status(201).json(newDoc);
  } catch (err) {
    console.error('Error inserting books:', err);
    res.status(500).json({ message: 'Error inserting books', error: err });
  }
});

// GET - Find books by author
app.get('/books/author/:author', async (req, res) => {
  const author = req.params.author;
  try {
    const docs = await db.find({ author: author });
    if (docs.length === 0) {
      return res.status(404).json({ message: 'No books found for this author' });
    }
    res.json(docs);
  } catch (err) {
    console.error('Error retrieving books:', err);
    res.status(500).json({ message: 'Error retrieving books' });
  }
});

// PUT - Update book pages by ID
app.put('/books/:id', async (req, res) => {
  const id = req.params.id;
  const { pages } = req.body;

  if (typeof pages !== 'number') {
    return res.status(400).json({ message: 'Pages should be a number' });
  }

  try {
    const doc = await db.findOne({ _id: id });
    if (!doc) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const numAffected = await db.update({ _id: id }, { $set: { pages: pages } });
    res.json({ message: 'Book updated successfully', numAffected });
  } catch (err) {
    console.error('Error updating book:', err);
    res.status(500).json({ message: 'Error updating book' });
  }
});

// DELETE - Delete a book by ID
app.delete('/books/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const numRemoved = await db.remove({ _id: id });
    if (numRemoved === 0) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json({ message: 'Book deleted successfully', numRemoved });
  } catch (err) {
    console.error('Error deleting book:', err);
    res.status(500).json({ message: 'Error deleting book' });
  }
});

// DELETE - Delete books with fewer than X pages
app.delete('/books/pages/:pages', async (req, res) => {
  const pages = parseInt(req.params.pages, 10);

  if (isNaN(pages)) {
    return res.status(400).json({ message: 'Pages must be a valid number' });
  }

  try {
    const numRemoved = await db.remove({ pages: { $lt: pages } }, { multi: true });
    res.json({ message: `Deleted ${numRemoved} book(s) with fewer than ${pages} pages.` });
  } catch (err) {
    console.error('Error deleting books:', err);
    res.status(500).json({ message: 'Error deleting books' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});