const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

//middleware
app.use(express.json())
app.use(cors())


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

        // job related api
        //posted all jobs data 
        app.post('/jobs', async (req, res) => {
            const newJob = req.body;
            const result = await jobsCollection.insertOne(newJob);
            res.send(result)
        })
        //get data by all data by eamil query
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
            const email = req.query.email;
            const query = { bidderEmail: email };
            const result = await bidsCollection.find(query).toArray();
            res.send(result)
        })
        //get all my bids request data by buyer eamil query
        app.get('/buyer', async (req, res) => {
            const email = req.query.email;
            const query = { buyerEmail: email };
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