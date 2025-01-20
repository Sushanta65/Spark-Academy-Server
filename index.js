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
    const teacherRequestCollection = client.db("SparkAcademy").collection("teacher-request");
    const teacherClassesCollection = client.db("SparkAcademy").collection("teacher-classes");

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


    // Teacher Request api
    app.post('/teacher-request', async(req, res) => {
      const requestFormData = req.body;
      const result = await teacherRequestCollection.insertOne(requestFormData)
      res.send(result)
    })

    app.get('/teacher-requests', async(req, res) => {
      const result = await teacherRequestCollection.find().toArray()
      res.send(result)
    })

    app.patch('/teacher-requests/:id', async(req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const updatedStatus = {
        $set: {
          status: req.body.status
        }
      }
      const result = await teacherRequestCollection.updateOne(filter, updatedStatus)
      res.send(result)
    })

    app.get('/teacher-request/:email', async(req, res) => {
      const query = {email: req.params.email}
      const result = await teacherRequestCollection.findOne(query)
      res.send(result)
    })

    app.patch('/teacher-request/:email', async(req, res) => {
      const filter = {email: req.params.email}
      const updatedStatus = {
        $set: {
          status: req.body.status
        }
      }
      const result = await teacherRequestCollection.updateOne(filter, updatedStatus)
      res.send(result)
    })


    app.patch('/users/:email', async(req, res) => {
      
      const filter = {email: req.params.email}
      const updatedUserRole = {
        $set: {
          role: req.body.role
        }
      }
      const result = await usersCollection.updateOne(filter, updatedUserRole)
      res.send(result)
    })


    //Teacher Class Related api

    app.post('/teacher-classes', async(req, res) => {
      const teacherClass = req.body
      const result = await teacherClassesCollection.insertOne(teacherClass)
      res.send(result)
     })

     app.get('/teacher-classes', async(req, res) => {
      const result = await teacherClassesCollection.find().toArray()
      res.send(result)
     })

     app.get('/teacher-classes/:email', async(req, res) => {
      const filter = {email: req.params.email}
      const result = await teacherClassesCollection.findOne(filter)
      res.send(result)
     })

     app.get('/my-classes/:email', async(req, res) => {
      const filter = {email: req.params.email}
      const result = await teacherClassesCollection.find(filter).toArray()
      res.send(result)
     })

     app.patch('/teacher-classes/:id', async(req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const updatedClassStatus = {
        $set: {
          status: req.body.status
        }
      }
      const result = await teacherClassesCollection.updateOne(filter, updatedClassStatus)
      res.send(result)
     })

     app.get('/dashboard/my-class/:id', async(req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const result = await teacherClassesCollection.findOne(filter)
      res.send(result)
     })

     app.patch('/teacher-class-update/:id', async(req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const updatedClass = {
        $set: {
          title: req.body.title,
          description: req.body.description,
          price: req.body.price,
          image: req.body.image
        }
      }
      const result = await teacherClassesCollection.updateOne(filter, updatedClass)
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
