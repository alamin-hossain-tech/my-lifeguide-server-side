const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");

const port = process.env.PORT || 4000;
require("dotenv").config();

// middleware
app.use(cors());
app.use(express.json());

//mongodbapi

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.rfyyfuu.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
// JWT
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
}
//mongodb try function start---
async function run() {
  try {
    const serviceCollection = client.db("my-life-guide").collection("services");
    const reviewsCollection = client.db("my-life-guide").collection("reviews");

    app.post("/add-service", async (req, res) => {
      const service = req.body;
      const result = await serviceCollection.insertOne(service);
      res.send(result);
    });

    app.get("/services", async (req, res) => {
      const query = {};
      const cursor = serviceCollection
        .find(query)
        .sort({ published: -1 })
        .limit(3);
      const services = await cursor.toArray();
      res.send(services);
    });
    app.get("/servicesall", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query).sort({ published: -1 });
      const services = await cursor.toArray();
      res.send(services);
    });

    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await serviceCollection.findOne(query);
      res.send(service);
    });

    // Reviews Api
    app.post("/addreview", async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      res.send(result);
    });
    app.get("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { serviceId: id };

      const reviews = await reviewsCollection
        .find(query)
        .sort({ publishedTime: -1 })
        .toArray();
      res.send(reviews);
    });
    app.get("/userreviews/:email", verifyJWT, async (req, res) => {
      const userEmail = req.params.email;
      const decoded = req.decoded;
      if (decoded.email !== userEmail) {
        res.status(403).send({ message: "Unauthorized Email" });
      }
      const query = { userEmail: userEmail };
      result = await reviewsCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/review/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviewsCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/getreviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviewsCollection.findOne(query);
      res.send(result);
    });

    app.put("/editreview/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const review = req.body;
      const option = { upsert: true };
      const updatedreview = {
        $set: {
          review: review.review,
          rating: parseInt(review.rating),
        },
      };
      const result = await reviewsCollection.updateOne(
        filter,
        updatedreview,
        option
      );
      res.send(result);
    });

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_TOKEN, {
        expiresIn: "1 days",
      });
      res.send({ token });
    });
  } finally {
  }
}
run().catch((error) => console.log(error));
//mongodb try function end---

// Express
app.listen(port, () => {
  console.log("Server running on port", port);
});

app.get("/", (req, res) => {
  res.send("Server Running");
});
