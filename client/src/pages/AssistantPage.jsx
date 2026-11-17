import { useState } from 'react';
import { analyzeMessage } from '../api/client';
import { SendIcon } from '../components/icons';
import ResultPanel from '../components/ResultPanel';
import SampleChips from '../components/SampleChips';
import VoiceInput from '../components/VoiceInput';

const MAX_LENGTH = 1000;

export default function AssistantPage() {
  const [message, setMessage] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState(null);
  const [resultContext, setResultContext] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await analyzeMessage({ message, customerName, phone });
      setResult(data);
      // What was typed at the time, so the chat preview does not change while the agent edits the form.
      setResultContext({ message, customerName: data.customer?.name || customerName, phone });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-stone-900">Reply assistant</h1>
        <p className="text-sm text-stone-500">Paste a customer message to get the price and a reply ready to send.</p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-5">
        <form onSubmit={handleSubmit} className="surface space-y-4 p-5 lg:col-span-2">
          <div>
            <label htmlFor="message" className="mb-2 block text-sm font-semibold text-stone-900">
              Customer message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={MAX_LENGTH}
              rows={5}
              required
              placeholder="Paste from WhatsApp"
              className="field resize-none leading-relaxed"
            />
            <div className="mt-1 text-right text-[11px] text-stone-400">
              {message.length}/{MAX_LENGTH}
            </div>
            <VoiceInput onText={(text) => setMessage((current) => (current ? `${current} ${text}` : text))} />
            <SampleChips onPick={setMessage} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Customer name (optional)" maxLength={80} className="field" />
            <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Phone (optional)" inputMode="tel" maxLength={20} className="field" />
          </div>

          <button type="submit" disabled={loading || !message.trim()} className="btn-primary flex w-full items-center justify-center gap-2 px-5 py-3.5 text-sm">
            <SendIcon size={16} />
            {loading ? 'Preparing reply…' : 'Get reply'}
          </button>

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
        </form>

        <div className="lg:col-span-3">
          {result ? (
            <ResultPanel key={result.leadId || result.reply} result={result} context={resultContext} />
          ) : (
            <p className="surface hidden p-8 text-center text-sm text-stone-400 lg:block">The reply and the price will appear here.</p>
          )}
        </div>
      </div>
    </div>
  );
}
