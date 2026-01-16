
import clientPromise from '../lib/mongodb';

export default async function handler(req: any, res: any) {
  try {
    const client = await clientPromise;
    const db = client.db('p2pizza');
    const collection = db.collection('settings');

    if (req.method === 'GET') {
      const settings = await collection.findOne({ id: 'site_config' });
      return res.status(200).json(settings || {
        logo: 'https://i.ibb.co/3ykCjFz/p2p-logo.png',
        phone: '+380 00 000 00 00',
        special: {
          title: 'СВІЖА. ГАРЯЧА. ТВОЯ.',
          description: 'Замовляй найкращу піцу в місті!',
          image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=2000'
        }
      });
    }

    if (req.method === 'POST') {
      const data = req.body;
      await collection.updateOne(
        { id: 'site_config' },
        { $set: { ...data, id: 'site_config' } },
        { upsert: true }
      );
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
