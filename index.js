// imports
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// Definition
const app = express();

// Middlewares
app.use(cors());

app.use(express.json());

app.use(async (req, res, next) => {
  console.log(
    `⚡ ${req.method} - ${req.path} from ${req.host} at ⌛ ${new Date().toLocaleString()}`
  );
  next();
});

//ports & clients
const port = process.env.PORT || 5000;

const uri = process.env.URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

//listeners
client
  .connect()
  .then(() => {
    app.listen(port, () => {
      console.log(`Hero Apps Server listening ${port}`);
      console.log(`Hero Apps Server Connected with DB`);
    });
  })
  .catch((err) => {
    console.log(err);
  });

//DB & collections
const database = client.db('heroAppsDB');
const appsCollection = database.collection('apps');
const installedAppsCollection = database.collection('installedApps');

//Apps Route

app.get('/apps', async (req, res) => {
  try {
    const { limit = 10, skip = 0, sortField = 'size', sortOrder = 'asc' } = req.query;
    console.log(req.query);
    console.log(limit, skip, sortField, sortOrder);

    const sortOption = {};
    sortOption[sortField] = sortOrder === 'asc' ? 1 : -1;

    console.log('sort option', sortOption);

    const apps = await appsCollection
      .find()
      .project({
        description: 0,
      })
      .sort(sortOption)
      .limit(Number(limit))
      .skip(Number(skip))
      .toArray();

    const count = await appsCollection.countDocuments();

    res.send({ apps, count });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/apps/install', async (req, res) => {
  try {
    const installedApps = await installedAppsCollection.find().toArray();
    res.send(installedApps);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/apps/install', async (req, res) => {
  try {
    const doc = req.body;
    const installedApps = await installedAppsCollection.insertOne(doc);
    res.send(installedApps);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/apps/:id', async (req, res) => {
  try {
    const appId = req.params.id;

    if (appId.length != 24) {
      res.status(400).json({ error: 'Invalid ID' });
      return;
    }
    const query = new ObjectId(appId);
    const app = await appsCollection.findOne({ _id: query });
    res.json(app);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/apps/install/:id', async (req, res) => {
  try {
    const query = { _id: new ObjectId(req.params.id) };
    const deletedApp = await installedAppsCollection.deleteOne(query);
    res.send(deletedApp);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Sever Error' });
  }
});

// Basic routes
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Hero Apps Server' });
});

// 404 Not found
app.all(/.*/, (req, res) => {
  res.status(404).json({
    status: 404,
    error: 'API not found',
  });
});
