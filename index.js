require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://story-safari.web.app",
      "https://story-safari.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

//jwt middleware
const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "Unauthorized Access 1" });
  }
  if (token) {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        console.log(err);
        return res.status(401).send({ message: "Unauthorized Access2" });
      }
      console.log(decoded);
      req.user = decoded;
      next();
    });
  }
};

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
    const onlineReadCollection = client
      .db("storySafari")
      .collection("onlineRead");
    const cartCollection = client.db("storySafari").collection("cart");
    // jwt generated
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "365d",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ succuss: true });
    });

    // Clear token on logout
    app.get("/logout", (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
          maxAge: 0,
        })
        .send({ success: true });
    });

    // create data in database
    app.post("/books", verifyToken, async (req, res) => {
      const tokenData = req.user;
      console.log(tokenData, "from token");
      // const tokenEmail = req.user.email;
      // const email = req.params.email;

      const books = req.body;
      const result = await booksCollection.insertOne(books);
      res.send(result);
    });

    app.get("/books", verifyToken, async (req, res) => {
      const tokenData = req.user;
      console.log(tokenData, "from token");
      // const tokenEmail = req.user.email;
      // const email = req.params.email;
      // if (tokenEmail !== email) {
      //   return res.status(403).send({ message: "Forbidden Access" });
      // }
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

    app.get("/borrowed/:email", verifyToken, async (req, res) => {
      const tokenData = req.user;
      console.log(tokenData, "from token");
      const tokenEmail = req.user.email;
      const email = req.params.email;
      if (tokenEmail !== email) {
        return res.status(403).send({ message: "Forbidden Access" });
      }
      const filter = { email: email };
      const result = await borrowCollection.find(filter).toArray();
      res.send(result);
    });

    app.get("/isBorrowed/:email/:id", async (req, res) => {
      // const id = req.params.id;
      // const email = req.params.email;
      const query = { book_id: req.params.id, email: req.params.email };
      const result = await borrowCollection.findOne(query);
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

    // Get online read books
    app.get("/onlineReadBooks", async (req, res) => {
      const result = await onlineReadCollection.find().toArray();
      res.send(result);
    });

    // Added cart data
    app.post("/cartData", async (req, res) => {
      const cart = req.body;
      const result = await cartCollection.insertOne(cart);
      res.send(result);
    });

    app.get("/cartData", async (req, res) => {
      const result = await cartCollection.find().toArray();
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
