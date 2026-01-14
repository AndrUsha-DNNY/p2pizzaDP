
import clientPromise from '../lib/mongodb';

export default async function handler(req: any, res: any) {
  try {
    const client = await clientPromise;
    const db = client.db('p2pizza');
    const collection = db.collection('pizzas');

    if (req.method === 'GET') {
      const pizzas = await collection.find({}).toArray();
      // Повертаємо масив, навіть якщо він порожній
      return res.status(200).json(pizzas || []);
    }

    if (req.method === 'POST') {
      const { pizzas } = req.body;
      if (!Array.isArray(pizzas)) {
        return res.status(400).json({ error: 'Invalid data format' });
      }

      // ВАЖЛИВО: Видаляємо _id з кожного об'єкта перед збереженням, 
      // щоб MongoDB не видавала помилку дублювання ключів
      const cleanedPizzas = pizzas.map(({ _id, ...rest }: any) => rest);

      await collection.deleteMany({});
      if (cleanedPizzas.length > 0) {
        await collection.insertMany(cleanedPizzas);
      }
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error: any) {
    console.error('API Pizzas Error:', error);
    return res.status(500).json({ error: 'Database error', details: error.message });
  }
}
