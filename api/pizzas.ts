
import clientPromise from '../lib/mongodb';

export default async function handler(req: any, res: any) {
  try {
    const client = await clientPromise;
    const db = client.db('p2pizza');
    const collection = db.collection('pizzas');

    if (req.method === 'GET') {
      const pizzas = await collection.find({}).toArray();
      return res.status(200).json(pizzas || []);
    }

    if (req.method === 'POST') {
      const { pizzas } = req.body;
      if (!Array.isArray(pizzas)) {
        return res.status(400).json({ error: 'Invalid data format' });
      }
      await collection.deleteMany({});
      if (pizzas.length > 0) {
        await collection.insertMany(pizzas);
      }
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error: any) {
    console.error('API Pizzas Error:', error);
    return res.status(500).json({ error: 'Database connection failed', details: error.message });
  }
}
