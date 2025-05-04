import { MongoClient } from 'mongodb';

const uri = process.env.NEXT_PUBLIC_MONGODBKEY;
const options = { useNewUrlParser: true, useUnifiedTopology: true };

let client;
let clientPromise;

if (!uri) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

if (process.env.NODE_ENV === 'development') {
  // En desarrollo se usa una variable global para preservar la conexión entre recargas (HMR)
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // En producción, se crea una nueva conexión (cada invocación puede ser un Cold Start)
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;





