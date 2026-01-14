
import clientPromise from '../lib/mongodb';

export default async function handler(req: any, res: any) {
  const client = await clientPromise;
  const db = client.db('p2pizza');
  const collection = db.collection('pizzas');

  if (req.method === 'GET') {
    const pizzas = await collection.find({}).toArray();
    return res.status(200).json(pizzas);
  }

  if (req.method === 'POST') {
    // В ідеалі тут має бути перевірка пароля адміна
    const { pizzas } = req.body;
    await collection.deleteMany({});
    await collection.insertMany(pizzas);
    return res.status(200).json({ success: true });
  }

  res.status(405).json({ message: 'Method not allowed' });
}
