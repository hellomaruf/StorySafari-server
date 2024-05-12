const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();

// middleware
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.USER}:${process.env.PASS}@cluster0.0o9qayn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    const booksCollection = client.db("storySafari").collection("books");
    const borrowCollection = client.db("storySafari").collection("borrow");

   
    // create data in database
    app.post("/books", async (req, res) => {
      const books = req.body;
      const result = await booksCollection.insertOne(books);
      res.send(result);
    });

    app.get("/books", async (req, res) => {
      const result = await booksCollection.find().toArray();
      res.send(result);
    });

    //find data by category name
    app.get("/books/:cateName", async (req, res) => {
      const cateName = req.params.cateName;
      const query = { category_name: cateName };
      const result = await booksCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/book/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await booksCollection.findOne(filter);
      res.send(result);
    });

    app.get("/update/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await booksCollection.findOne(filter);
      res.send(result);
    });
    // update books
    app.put("/update/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const book = req.body;
      const updateBook = {
        $set: {
          category_name: book.category_name,
          book_name: book.book_name,
          rating: book.rating,
          author_Name: book.author_Name,
          photo: book.photo,
        },
      };
      const result = await booksCollection.updateOne(
        filter,
        updateBook,
        options
      );
      res.send(result);
    });

    //create data for borrow books
    app.post("/borrow", async (req, res) => {
      const borrow = req.body;
      const result = await borrowCollection.insertOne(borrow);
      res.send(result);
    });

    app.get("/borrowed/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const result = await borrowCollection.find(filter).toArray();
      res.send(result);
    });

    //update quantity
    app.patch("/reduceQua/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await booksCollection.updateOne(query, {
        $inc: { quantity: -1 },
      });
      res.send(result);
    });

    app.patch("/return/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await booksCollection.updateOne(query, {
        $inc: { quantity: 1 },
      });
      res.send(result);
    });

    app.delete("/borrowedBook/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await borrowCollection.deleteOne(query);
      res.send(result);
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("StorySafari server is running!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
