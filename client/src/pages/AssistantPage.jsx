import { useState } from 'react';
import { analyzeMessage } from '../api/client';
import ResultPanel from '../components/ResultPanel';
import { SAMPLE_MESSAGES } from '../constants';

const MAX_LENGTH = 1000;

export default function AssistantPage() {
  const [message, setMessage] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState(null);
  const [resultPhone, setResultPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await analyzeMessage({ message, customerName, phone });
      setResult(data);
      setResultPhone(phone);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div>
          <label htmlFor="message" className="mb-2 block text-sm font-semibold text-stone-800">
            Customer message (paste from WhatsApp)
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={MAX_LENGTH}
            rows={4}
            required
            placeholder="Neelam ka rate kya hai 5 ratti?"
            className="w-full rounded-xl border border-stone-300 p-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {SAMPLE_MESSAGES.map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => setMessage(sample)}
                className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs text-orange-800 hover:bg-orange-100"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            placeholder="Customer name (optional)"
            maxLength={80}
            className="rounded-xl border border-stone-300 p-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
          />
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Phone (optional, enables WhatsApp button)"
            inputMode="tel"
            maxLength={20}
            className="rounded-xl border border-stone-300 p-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="w-full rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50 sm:w-auto"
        >
          {loading ? 'Preparing reply…' : 'Get reply'}
        </button>

        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      </form>

      {result && <ResultPanel key={result.leadId || result.reply} result={result} phone={resultPhone} />}
    </div>
  );
}
