// Import required modules
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
dotenv.config();

const app = express();
const port = process.env.PORT || 5200;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER_NAME}:${process.env.DB_PASS}@cluster0.uksn0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const usersCollection = client.db("SparkAcademy").collection("users");

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = {email: user.email}
      const existUser = await usersCollection.findOne(query)
      if(existUser){
        return res.send({message: 'User Already Exist.'})
      }

      const result = await usersCollection.insertOne(user);
      return res.send(result);
    });

    app.get("/users", async (req, res) => {
      const users = await usersCollection.find().toArray();
      res.send(users);
    });

    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedInfo = { $set: { role: "admin" } };
      const result = await usersCollection.updateOne(filter, updatedInfo);
      res.send(result);
    });

    app.get('/users/:email', async (req, res) => {
      const email = req.params.email;
      const query = {email}
      const result = await usersCollection.findOne(query)
      res.send(result)
    })

    app.get("/", (req, res) => {
      res.send("Your App is Running Properly.");
    });

    await client.db("admin").command({ ping: 1 });
    console.log("You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
