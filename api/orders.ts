
import clientPromise from '../lib/mongodb';

export default async function handler(req: any, res: any) {
  try {
    const client = await clientPromise;
    const db = client.db('p2pizza');
    const collection = db.collection('orders');

    if (req.method === 'GET') {
      const orders = await collection.find({}).sort({ _id: -1 }).toArray();
      return res.status(200).json(orders || []);
    }

    if (req.method === 'POST') {
      const order = req.body;
      const result = await collection.insertOne(order);
      return res.status(201).json({ ...order, _id: result.insertedId });
    }

    if (req.method === 'PATCH') {
      const { id, status } = req.body;
      await collection.updateOne({ id: id }, { $set: { status: status } });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error: any) {
    console.error('API Orders Error:', error);
    return res.status(500).json({ error: 'Failed to process order', details: error.message });
  }
}
