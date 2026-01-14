
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { callback_query } = req.body;
  const token = req.query.token;

  if (!callback_query || !token) return res.status(200).send('Missing data');

  const data = callback_query.data; // Формат: status_ready_P2P-X1Y2Z3
  const [ , action, orderId] = data.split('_');
  
  const statusMap: Record<string, string> = {
    'prep': 'Готується',
    'ready': 'Готово',
    'comp': 'Виконано',
    'canc': 'Скасовано'
  };

  const newStatus = statusMap[action] || 'Оновлено';

  // 1. Відповідаємо в Telegram (спливаюче вікно)
  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callback_query.id,
      text: `Статус замовлення ${orderId} змінено на: ${newStatus}`
    })
  });

  // 2. Оновлюємо текст повідомлення, додаючи галочку підтвердження
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
      reply_markup: callback_query.message.reply_markup // Залишаємо ті ж кнопки
    })
  }).catch(() => {
     // Якщо не вдалося editMessageText (наприклад, повідомлення з фото), пробуємо editMessageCaption
     fetch(`https://api.telegram.org/bot${token}/editMessageCaption`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: callback_query.message.chat.id,
          message_id: callback_query.message.message_id,
          caption: updatedCaption,
          parse_mode: 'HTML',
          reply_markup: callback_query.message.reply_markup
        })
     });
  });

  return res.status(200).json({ success: true });
}
