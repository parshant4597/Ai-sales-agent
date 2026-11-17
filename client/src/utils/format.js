export const formatInr = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;

// "Ramesh Sharma" -> "RS", "priya" -> "P". Used for avatar circles.
export function getInitials(name) {
  const words = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  return (words[0][0] + (words.length > 1 ? words[words.length - 1][0] : '')).toUpperCase();
}

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
