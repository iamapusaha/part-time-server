const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config()
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

//middleware
app.use(express.json())
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}))
app.use(cookieParser())

const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).send({ message: "unauthorized  access" })
    }
    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: "unauthorized  access" })
        }
        req.user = decoded;
        next()
    })

}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.3k7cyas.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection

        const jobsCollection = client.db('jobsDB').collection('jobs');
        const bidsCollection = client.db('bidsDB').collection('bids');
        //auth related api
        app.post('/jwt', async (req, res) => {
            const user = req.body.email;
            const token = jwt.sign({ user }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' })
            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'none'
            })
                .send({ success: true })
        })
        app.post('/logout', async (req, res) => {
            res.clearCookie('token', { maxAge: 0 })
                .send({ success: true })
        })
        // job related api
        //posted all jobs data 
        app.post('/jobs', async (req, res) => {
            const newJob = req.body;
            const result = await jobsCollection.insertOne(newJob);
            res.send(result)
        })
        //get all data by eamil query
        app.get('/jobs', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await jobsCollection.find(query).toArray();
            res.send(result)
        })
        // get all data by category
        app.get('/jobs/:category', async (req, res) => {
            const category = req.params.category;
            const query = { category: category }
            const result = await jobsCollection.find(query).toArray();
            res.send(result)
        })
        // get one data by id
        app.get('/jobs/v1/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await jobsCollection.findOne(query)
            res.send(result)
        })
        // update job data info
        app.patch('/jobs/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateJobs = req.body;
            const updateJobsData = {
                $set: {
                    title: updateJobs.title,
                    email: updateJobs.email,
                    photo: updateJobs.photo,
                    date: updateJobs.date,
                    category: updateJobs.category,
                    minPrice: updateJobs.minPrice,
                    maxPrice: updateJobs.maxPrice,
                    discription: updateJobs.discription
                },
            };
            const result = await jobsCollection.updateOne(filter, updateJobsData)
            res.send(result)
        })
        // delete job data info my id
        app.delete('/jobs/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await jobsCollection.deleteOne(query)
            res.send(result)
        })


        // bid related api
        // post all bids data
        app.post('/bids', async (req, res) => {
            const newBid = req.body;
            const result = await bidsCollection.insertOne(newBid);
            res.send(result)
        })
        // bids status update
        app.patch('/bids/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateBids = req.body;
            const updateInfo = {
                $set: {
                    status: updateBids.status
                },
            };
            const result = await bidsCollection.updateOne(filter, updateInfo);
            res.send(result)
        })

        //get all my bids data by eamil query
        app.get('/bidder', async (req, res) => {
            if (req.query.email !== req.user.user) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            let query = {};
            if (req.query?.email) {
                const email = req.query.email;
                query = { bidderEmail: email }
            }
            const result = await bidsCollection.find(query).toArray();
            res.send(result)
        })
        //get all my bids request data by buyer eamil query
        app.get('/buyer', verifyToken, async (req, res) => {
            if (req.query.email !== req.user.user) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            let query = {};
            if (req.query?.email) {
                const email = req.query.email;
                query = { buyerEmail: email }
            }
            const result = await bidsCollection.find(query).toArray();
            res.send(result)
        })



        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Part Time server is Running..')
})
app.listen(port, () => {
    console.log(`Part time app listing on port ${port}`);
})