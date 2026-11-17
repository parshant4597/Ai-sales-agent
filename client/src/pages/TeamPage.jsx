import { useEffect, useState } from 'react';
import { createUser, deleteUser, fetchUsers, resetUserPassword } from '../api/client';
import Badge from '../components/Badge';
import { KeyIcon, PlusIcon, TrashIcon } from '../components/icons';
import { useAuth } from '../hooks/useAuth';
import { formatDateTime, getInitials } from '../utils/format';

const PASSWORD_CHARS = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// 12 random characters without look-alikes (0/O, 1/l/I), using the browser's secure random source.
function generatePassword() {
  const values = crypto.getRandomValues(new Uint32Array(12));
  return Array.from(values, (value) => PASSWORD_CHARS[value % PASSWORD_CHARS.length]).join('');
}

function AddMemberForm({ onAdded }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [added, setAdded] = useState(null);

  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setAdded(null);
    try {
      await createUser(form);
      setAdded({ name: form.name, email: form.email, password: form.password });
      setForm({ name: '', email: '', password: '', role: 'member' });
      onAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="surface space-y-4 p-5">
      <div>
        <h2 className="flex items-center gap-2 text-sm font-semibold text-stone-900">
          <PlusIcon size={16} /> Add a team member
        </h2>
        <p className="mt-1 text-xs text-stone-500">They sign in with this email and password. Share the password with them privately.</p>
      </div>

      <input value={form.name} onChange={update('name')} placeholder="Full name" required maxLength={60} className="field" />
      <input value={form.email} onChange={update('email')} type="email" placeholder="Email" required autoComplete="off" className="field" />
      <div className="flex gap-2">
        <input
          value={form.password}
          onChange={update('password')}
          placeholder="Password (8+ characters)"
          required
          minLength={8}
          autoComplete="off"
          className="field"
        />
        <button type="button" onClick={() => setForm((current) => ({ ...current, password: generatePassword() }))} className="btn-secondary shrink-0 px-3 text-sm">
          Generate
        </button>
      </div>
      <select value={form.role} onChange={update('role')} aria-label="Role" className="field">
        <option value="member">Member: can use the sales tool</option>
        <option value="admin">Admin: can also manage the team</option>
      </select>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {added && (
        <div role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
          <p className="font-medium">{added.name} can now sign in.</p>
          <p className="mt-1 break-all text-xs">
            {added.email} · password <span className="font-mono font-semibold">{added.password}</span>
          </p>
          <p className="mt-1 text-xs text-emerald-700">This is the only time the password is shown. Copy it now.</p>
        </div>
      )}

      <button type="submit" disabled={busy} className="btn-primary w-full px-4 py-2.5 text-sm">
        {busy ? 'Adding…' : 'Add member'}
      </button>
    </form>
  );
}

function MemberRow({ member, isSelf, onChanged }) {
  const [mode, setMode] = useState('idle'); // idle | reset | remove
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  async function run(action, successText) {
    setBusy(true);
    setMessage({ type: '', text: '' });
    try {
      await action();
      setMode('idle');
      setPassword('');
      if (successText) setMessage({ type: 'ok', text: successText });
      onChanged();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="py-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Avatar and name stay together; the buttons wrap underneath on a phone */}
        <div className="flex min-w-0 flex-1 basis-64 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-rose-500 text-sm font-semibold text-white">
            {getInitials(member.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-stone-900">
              {member.name}
              {isSelf && <Badge className="bg-sky-100 text-sky-800">You</Badge>}
              <Badge className={member.role === 'admin' ? 'bg-orange-100 text-orange-800' : 'bg-stone-100 text-stone-700'}>{member.role}</Badge>
            </p>
            <p className="truncate text-xs text-stone-500">
              {member.email} · {member.lastLoginAt ? `last sign-in ${formatDateTime(member.lastLoginAt)}` : 'never signed in'}
            </p>
          </div>
        </div>

        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <button type="button" onClick={() => setMode(mode === 'reset' ? 'idle' : 'reset')} className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs">
            <KeyIcon size={14} /> Reset password
          </button>
          {!isSelf && (
            <button
              type="button"
              onClick={() => setMode(mode === 'remove' ? 'idle' : 'remove')}
              className="flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
            >
              <TrashIcon size={14} /> Remove
            </button>
          )}
        </div>
      </div>

      {mode === 'reset' && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            run(() => resetUserPassword(member.id, password), `New password set for ${member.name}. They are signed out everywhere.`);
          }}
          className="mt-3 flex flex-wrap gap-2"
        >
          <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="New password (8+ characters)" required minLength={8} autoComplete="off" className="field" />
          <button type="button" onClick={() => setPassword(generatePassword())} className="btn-secondary shrink-0 px-3 text-xs">
            Generate
          </button>
          <button type="submit" disabled={busy} className="btn-primary shrink-0 px-4 text-xs">
            Save
          </button>
        </form>
      )}

      {mode === 'remove' && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">
          <span className="flex-1">Remove {member.name}? They lose access immediately.</span>
          <button type="button" onClick={() => setMode('idle')} className="btn-secondary px-3 py-1.5 text-xs">
            Cancel
          </button>
          <button type="button" disabled={busy} onClick={() => run(() => deleteUser(member.id))} className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700">
            Yes, remove
          </button>
        </div>
      )}

      {message.text && (
        <p role={message.type === 'error' ? 'alert' : 'status'} className={`mt-2 text-xs ${message.type === 'error' ? 'text-red-700' : 'text-emerald-700'}`}>
          {message.text}
        </p>
      )}
    </li>
  );
}

export default function TeamPage() {
  const { user } = useAuth();
  const [reloadTick, setReloadTick] = useState(0);
  const [result, setResult] = useState({ key: -1, users: null });
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchUsers()
      .then(({ users }) => {
        if (cancelled) return;
        setResult({ key: reloadTick, users });
        setError('');
      })
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [reloadTick]);

  const reload = () => setReloadTick((tick) => tick + 1);
  const users = result.users;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-stone-900">Team</h1>
        <p className="text-sm text-stone-500">Only people listed here can sign in. There is no public sign-up.</p>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="surface min-w-0 p-5">
          <h2 className="mb-1 text-sm font-semibold text-stone-900">Members {users && <span className="font-normal text-stone-500">({users.length})</span>}</h2>
          {!users && !error && <p className="py-6 text-sm text-stone-500">Loading…</p>}
          <ul className="divide-y divide-stone-100">
            {users?.map((member) => (
              <MemberRow key={member.id} member={member} isSelf={member.id === user.id} onChanged={reload} />
            ))}
          </ul>
        </section>

        <AddMemberForm onAdded={reload} />
      </div>
    </div>
  );
}
