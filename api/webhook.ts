
import clientPromise from '../lib/mongodb';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { callback_query } = req.body;
  const token = req.query.token;

  if (!callback_query || !token) return res.status(200).send('Missing data');

  const data = callback_query.data; 
  const [ , action, orderId] = data.split('_');
  
  const statusMap: Record<string, string> = {
    'prep': 'Готується',
    'ready': 'Готово',
    'comp': 'Виконано',
    'canc': 'Скасовано'
  };

  const newStatus = statusMap[action] || 'Оновлено';

  try {
    // 1. Оновлюємо статус у MongoDB, щоб сайт одразу показав зміни
    const client = await clientPromise;
    const db = client.db('p2pizza');
    await db.collection('orders').updateOne(
      { id: orderId }, 
      { $set: { status: newStatus, preparingStartTime: action === 'prep' ? Date.now() : undefined } }
    );

    // 2. Відповідаємо в Telegram (спливаюче вікно)
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callback_query.id,
        text: `Статус замовлення ${orderId} змінено на: ${newStatus}`
      })
    });

    // 3. Оновлюємо текст повідомлення в Telegram
    const currentCaption = callback_query.message.text || callback_query.message.caption || '';
    const updatedCaption = currentCaption + `\n\n✅ <b>ОСТАННЯ ДІЯ: ${newStatus.toUpperCase()}</b>`;

    await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: callback_query.message.chat.id,
        message_id: callback_query.message.message_id,
        text: updatedCaption,
        parse_mode: 'HTML',
        reply_markup: callback_query.message.reply_markup
      })
    });

    return res.status(200).json({ success: true });
  } catch (e: any) {
    console.error('Webhook processing error', e);
    return res.status(500).json({ error: e.message });
  }
}
