const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;

//middleware
const corsConfig = {
  origin: "*", // Allow requests from any origin
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
};
app.use(cors(corsConfig));

app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "Unauthorized access" });
  }

  const token = authorization.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: "Invalid token" });
    }

    if (!decoded.email) {
      return res
        .status(401)
        .send({ error: true, message: "Invalid token payload" });
    }

    req.decoded = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vweq3se.mongodb.net/?retryWrites=true&w=majority`;

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
    const collegesCollection = client.db("studyCamp").collection("colleges");
    const MyCollegeCollection = client.db("studyCamp").collection("myCollege");
    const candidateCollection = client
      .db("studyCamp")
      .collection("candidateCollection");

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "24h",
      });

      res.send({ token });
    });

    // colleges  apis
    app.get("/colleges", async (req, res) => {
      const result = await collegesCollection.find().toArray();
      res.send(result);
    });

    app.get("/best-colleges", async (req, res) => {
      const limit = req.query.limit ? parseInt(req.query.limit) : 3;
      const result = await collegesCollection.find().limit(limit).toArray();
      res.send(result);
    });

    app.get("/users/colleges/:id", async (req, res) => {
      const id = req.params.id;

      try {
        const colleges = await collegesCollection.findOne({
          _id: new ObjectId(id),
        });
        if (!colleges) {
          return res
            .status(404)
            .json({ error: true, message: "colleges not found" });
        }

        res.json(colleges);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, message: "Server error" });
      }
    });
    // my college api

    // post candidate information
    app.post("/candidate", async (req, res) => {
      const info = req.body;
      console.log(info);
      const result = await candidateCollection.insertOne(info);
      res.send(result);
    });

    // get candidate information by email
    app.get("/mycollege", async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const cursor = candidateCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("StudyCamp server is running");
});

app.listen(port, () => {
  console.log(`StudyCamp server is running on port: ${port}`);
});
