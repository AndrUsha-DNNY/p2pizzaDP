
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

      // Очищуємо ідентифікатори, щоб уникнути конфліктів у MongoDB
      const cleanedPizzas = pizzas.map(({ _id, ...rest }: any) => rest);

      console.log(`Attempting to save ${cleanedPizzas.length} items to pizzas collection...`);
      
      await collection.deleteMany({});
      if (cleanedPizzas.length > 0) {
        await collection.insertMany(cleanedPizzas);
      }
      
      console.log('Successfully updated pizzas in database.');
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error: any) {
    console.error('SERVER API PIZZAS ERROR:', error);
    return res.status(500).json({ 
      error: 'Database error', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
}
