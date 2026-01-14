
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { callback_query } = req.body;
  if (!callback_query) return res.status(200).send('No callback query');

  const data = callback_query.data; // Формат: status_ready_P2P-X1Y2Z3
  const [ , action, orderId] = data.split('_');
  
  const statusMap: Record<string, string> = {
    'prep': 'Готується',
    'ready': 'Готово',
    'comp': 'Виконано',
    'canc': 'Скасовано'
  };

  const newStatus = statusMap[action];
  const botToken = process.env.TG_TOKEN || ''; // Можна також передати в URL

  // Отримуємо налаштування з бази або середовища
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Оновлюємо статус в базі
  const { error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId);

  // 2. Відповідаємо в Telegram
  const text = `Статус замовлення ${orderId} змінено на: ${newStatus}`;
  await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callback_query.id,
      text: text
    })
  });

  // 3. Редагуємо повідомлення, щоб підтвердити зміну
  await fetch(`https://api.telegram.org/bot${botToken}/editMessageCaption`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: callback_query.message.chat.id,
      message_id: callback_query.message.message_id,
      caption: callback_query.message.caption + `\n\n✅ ОНОВЛЕНО: ${newStatus}`,
      parse_mode: 'HTML'
    })
  });

  return res.status(200).json({ success: true });
}
