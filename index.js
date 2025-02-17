// Import required modules
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
dotenv.config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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
    // await client.connect();
    const usersCollection = client.db("SparkAcademy").collection("users");
    const teacherRequestCollection = client
      .db("SparkAcademy")
      .collection("teacher-request");
    const teacherClassesCollection = client
      .db("SparkAcademy")
      .collection("teacher-classes");
    const assignmentsCollection = client
      .db("SparkAcademy")
      .collection("assignments");
    const paymentCollection = client.db("SparkAcademy").collection("payments");
    const enrollCollection = client
      .db("SparkAcademy")
      .collection("enroll-classes");
    const submissionsCollection = client
      .db("SparkAcademy")
      .collection("submissions");
    const reviewsCollection = client.db("SparkAcademy").collection("reviews");

    const blogsCollection = client.db("SparkAcademy").collection('blogsCollection');

    // JWT Related Api

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.SECRET_TOKEN, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existUser = await usersCollection.findOne(query);
      if (existUser) {
        return res.send({ message: "User Already Exist." });
      }

      const result = await usersCollection.insertOne(user);
      return res.send(result);
    });

    //Middleware

    const verifyToken = (req, res, next) => {
      if (!req.headers.authorization) {
        res.status(401).send("forbbinden");
      }
      const token = req.headers.authorization.split(" ")[1];

      jwt.verify(token, process.env.SECRET_TOKEN, (err, decoded) => {
        if (err) {
          res.status(401).send({ message: "forbidden access" });
        }
        req.decoded = decoded;
        next();
      });
    };

    app.get("/users", verifyToken, async (req, res) => {
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

    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    //After 3 hours spand I can done it.
    app.get("/users-search", async (req, res) => {
      try {
        const search = req.query.search || "";

        const filter = search
          ? {
              $or: [
                { email: { $regex: search, $options: "i" } },
                { name: { $regex: search, $options: "i" } },
              ],
            }
          : {};
        const users = await usersCollection.find(filter).toArray();
        res.send(users);
      } catch (error) {
        console.error("Error fetching :", error);
        res.send({ error: "Internal Server Error" });
      }
    });

    // Teacher Request api
    app.post("/teacher-request", async (req, res) => {
      const requestFormData = req.body;
      const result = await teacherRequestCollection.insertOne(requestFormData);
      res.send(result);
    });

    app.get("/teacher-requests", async (req, res) => {
      const result = await teacherRequestCollection.find().toArray();
      res.send(result);
    });

    app.patch("/teacher-requests/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedStatus = {
        $set: {
          status: req.body.status,
        },
      };
      const result = await teacherRequestCollection.updateOne(
        filter,
        updatedStatus
      );
      res.send(result);
    });

    app.get("/teacher-request/:email", async (req, res) => {
      const query = { email: req.params.email };
      const result = await teacherRequestCollection.findOne(query);
      res.send(result);
    });

    app.patch("/teacher-request/:email", async (req, res) => {
      const filter = { email: req.params.email };
      const updatedStatus = {
        $set: {
          status: req.body.status,
        },
      };
      const result = await teacherRequestCollection.updateOne(
        filter,
        updatedStatus
      );
      res.send(result);
    });

    app.patch("/users/:email", async (req, res) => {
      const filter = { email: req.params.email };
      const updatedUserRole = {
        $set: {
          role: req.body.role,
        },
      };
      const result = await usersCollection.updateOne(filter, updatedUserRole);
      res.send(result);
    });

    //Teacher Class Related Apis

    app.post("/teacher-classes", async (req, res) => {
      const teacherClass = req.body;
      const result = await teacherClassesCollection.insertOne(teacherClass);
      res.send(result);
    });

    app.get("/teacher-classes", async (req, res) => {
      const result = await teacherClassesCollection.find().toArray();
      res.send(result);
    });

    app.get("/teacher-classes/:email", async (req, res) => {
      const filter = { email: req.params.email };
      const result = await teacherClassesCollection.findOne(filter);
      res.send(result);
    });

    app.get("/my-classes/:email", async (req, res) => {
      const filter = { email: req.params.email };
      const result = await teacherClassesCollection.find(filter).toArray();
      res.send(result);
    });

    app.patch("/teacher-classes/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedClassStatus = {
        $set: {
          status: req.body.status,
        },
      };
      const result = await teacherClassesCollection.updateOne(
        filter,
        updatedClassStatus
      );
      res.send(result);
    });

    app.patch("/teacher-class/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };

      const currentEnrolled = parseInt(req.body.enrolled, 10);

      const updatedClassEnrolled = {
        $set: {
          enrolled: currentEnrolled + 1,
        },
      };
      const result = await teacherClassesCollection.updateOne(
        filter,
        updatedClassEnrolled
      );
      res.send(result);
    });

    app.get("/dashboard/my-class/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await teacherClassesCollection.findOne(filter);
      res.send(result);
    });

    app.get("/class-details/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await teacherClassesCollection.findOne(filter);
      res.send(result);
    });

    app.patch("/teacher-class-update/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedClass = {
        $set: {
          title: req.body.title,
          description: req.body.description,
          price: req.body.price,
          image: req.body.image,
        },
      };
      const result = await teacherClassesCollection.updateOne(
        filter,
        updatedClass
      );
      res.send(result);
    });

    app.delete("/delete-class/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await teacherClassesCollection.deleteOne(query);
      res.send(result);
    });

    //  Assignment Related Apis
    app.post("/assignments", async (req, res) => {
      const assignment = req.body;
      const result = await assignmentsCollection.insertOne(assignment);
      res.send(result);
    });

    app.get("/assignments/:classId", async (req, res) => {
      const filter = { classId: req.params.classId };
      const result = await assignmentsCollection.find(filter).toArray();
      res.send(result);
    });

    // Payment Api
    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount || 150 * 100,
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    app.post("/payments", async (req, res) => {
      const payment = req.body;
      const result = await paymentCollection.insertOne(payment);
      res.send(result);
    });

    app.get('/payments-history/:email', async(req, res) => {
      const filter = {email: req.params.email}
      const result = await paymentCollection.find(filter).toArray()
      res.send(result)
    })

    app.post("/enrolled-classes", async (req, res) => {
      const enrollInfo = req.body;
      const filter = {
        classId: req.body.classId,
        studentEmail: req.body.studentEmail,
      };
      const exist = await enrollCollection.findOne(filter);

      if (exist) {
        res.send({ message: "already-enrolled" });
        return;
      }
      const result = await enrollCollection.insertOne(enrollInfo);
      res.send(result);
    });

    app.get("/enrolled-classes/:studentEmail", async (req, res) => {
      const filter = { studentEmail: req.params.studentEmail };
      const result = await enrollCollection.find(filter).toArray();
      res.send(result);
    });

    app.get("/enrolled-class/:id", async (req, res) => {
      const filter = { _id: new ObjectId(req.params.id) };
      const result = await enrollCollection.findOne(filter);
      res.send(result);
    });

    // Assignment Submission Related Apis

    app.post("/submit-assignment", async (req, res) => {
      const { assignmentId, studentEmail, assignmentSubmitLink } = req.body;

      if (!assignmentId || !studentEmail || !assignmentSubmitLink) {
        return res
          .status(400)
          .send({ success: false, message: "Missing data" });
      }

      const existingSubmission = await submissionsCollection.findOne({
        assignmentId,
        studentEmail,
      });

      if (existingSubmission) {
        return res
          .status(400)
          .send({ success: false, message: "Already-submitted" });
      }

      const newSubmission = {
        assignmentId,
        studentEmail,
        assignmentSubmitLink,
        submittedAt: new Date(),
      };

      await submissionsCollection.insertOne(newSubmission);
      const filter = {};
      try {
        filter._id = new ObjectId(assignmentId);
      } catch (error) {
        return res
          .status(400)
          .send({ success: false, message: "Invalid assignment ID" });
      }
      await assignmentsCollection.updateOne(filter, {
        $inc: { submission: 1 },
      });

      res.send({ success: true, message: "Submission-successful!" });
    });

    // Reviews Related Apis

    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const classId = req.body.classId;
      const studentEmail = req.body.studentEmail;
      const existReview = await reviewsCollection.findOne({
        classId,
        studentEmail,
      });
      if (existReview) {
        return res.send({ success: false, message: "review-exist" });
      }
      const result = await reviewsCollection.insertOne(review);
      res.send(result);
    });

    app.get("/reviews", async (req, res) => {
      const result = await reviewsCollection.find().toArray();
      res.send(result);
    });

    // Statistics Api

    app.get("/statistics", async (req, res) => {
      const totalUsers = (await usersCollection.find().toArray()).length;
      const totalClasses = (await teacherClassesCollection.find().toArray())
        .length;
      const totalEnrolled = (await enrollCollection.find().toArray()).length;
      const statistics = {
        totalUsers,
        totalClasses,
        totalEnrolled,
      };
      res.send(statistics);
    });

    app.get("/", (req, res) => {
      res.send("Your App is Running Properly.");
    });

    app.post('/blogs', async(req, res) => {
      const blog = req.body;
      const result = await blogsCollection.insertOne(blog)
      res.send(result)
    })

    app.get('/blogs', async (req, res) => {
      const result = await blogsCollection.find().toArray()
      res.send(result)
    })

    // await client.db("admin").command({ ping: 1 });
    // console.log("You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
