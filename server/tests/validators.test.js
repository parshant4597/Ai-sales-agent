import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseAnalyzeBody, parseDays, parseLeadFilters, parseNote } from '../src/validators/index.js';

describe('parseDays', () => {
  it('defaults to 7 and accepts the three ranges', () => {
    assert.equal(parseDays({}), 7);
    for (const days of ['7', '14', '30']) assert.equal(parseDays({ days }), Number(days));
  });
  it('rejects anything else', () => {
    for (const days of ['3', '0', '-7', 'abc', '7.5', '', '30; drop']) {
      assert.throws(() => parseDays({ days }), /days must be one of/, days);
    }
  });
});

describe('parseLeadFilters', () => {
  it('passes valid filters through', () => {
    assert.deepEqual(parseLeadFilters({ status: 'won', intent: 'complaint', day: '2026-11-16', q: ' neelam ' }), {
      status: 'won',
      intent: 'complaint',
      day: '2026-11-16',
      q: 'neelam',
    });
  });
  it('treats "all" as no filter', () => {
    assert.deepEqual(parseLeadFilters({ status: 'all', intent: 'all' }), {});
  });
  it('rejects unknown values', () => {
    assert.throws(() => parseLeadFilters({ status: 'hacked' }), /Status must be/);
    assert.throws(() => parseLeadFilters({ intent: 'hacked' }), /Intent must be/);
    for (const day of ['bad', '2026-13-45', '16-11-2026', '2026-1-1']) {
      assert.throws(() => parseLeadFilters({ day }), /Day must look like/, day);
    }
  });
  it('ignores objects and arrays, so query-string injection does nothing', () => {
    // ?status[$ne]=new and ?q[]=a&q[]=b arrive as objects/arrays, not strings
    assert.deepEqual(parseLeadFilters({ status: { $ne: 'new' }, q: ['a', 'b'], intent: { $gt: '' }, day: { $lt: 'z' } }), {});
  });
});

describe('parseAnalyzeBody', () => {
  it('cleans the phone number and trims the name', () => {
    const parsed = parseAnalyzeBody({ message: ' neelam 5 ratti ', customerName: ' Ramesh ', phone: '+91 98765-43210abc' });
    assert.deepEqual(parsed, { message: 'neelam 5 ratti', customerName: 'Ramesh', phone: '+91 98765-43210' });
  });
  it('rejects empty, non-text and over-long messages', () => {
    for (const message of [undefined, null, '', '   ', 123, ['x'], { a: 1 }]) {
      assert.throws(() => parseAnalyzeBody({ message }), /Paste the customer message/);
    }
    assert.throws(() => parseAnalyzeBody({ message: 'a'.repeat(1001) }), /too long/);
    assert.throws(() => parseAnalyzeBody(undefined), /Paste the customer message/);
  });
});

describe('parseNote', () => {
  it('requires 1 to 500 characters', () => {
    assert.equal(parseNote({ text: ' called ' }), 'called');
    assert.throws(() => parseNote({ text: '  ' }), /empty/);
    assert.throws(() => parseNote({ text: 'a'.repeat(501) }), /too long/);
  });
});
