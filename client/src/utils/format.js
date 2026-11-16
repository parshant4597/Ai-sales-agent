export const formatInr = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;

export function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Link that opens WhatsApp with the reply already typed. Indian 10-digit numbers get +91.
export function buildWhatsAppLink(phone, text) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 10) return null;
  const international = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${international}?text=${encodeURIComponent(text)}`;
}
