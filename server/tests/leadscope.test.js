import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { leadScope } from '../src/services/lead.service.js';
import { parseLeadFilters } from '../src/validators/index.js';

describe('who can see which leads', () => {
  it('limits a member to the leads they created', () => {
    assert.deepEqual(leadScope({ role: 'member', _id: 'u1' }), { createdBy: 'u1' });
  });

  it('lets an admin see every lead', () => {
    assert.deepEqual(leadScope({ role: 'admin', _id: 'u9' }), {});
  });

  it('treats any unknown role as a member (safe by default)', () => {
    assert.deepEqual(leadScope({ role: 'superuser', _id: 'u2' }), { createdBy: 'u2' });
    assert.deepEqual(leadScope({ role: undefined, _id: 'u3' }), { createdBy: 'u3' });
  });
});

describe('the agent filter', () => {
  const id = '64b0000000000000000000aa';

  it('accepts a team member id and "none" (leads without an owner)', () => {
    assert.equal(parseLeadFilters({ agent: id }).agent, id);
    assert.equal(parseLeadFilters({ agent: 'none' }).agent, 'none');
  });

  it('treats "all" and an empty value as no filter', () => {
    assert.equal(parseLeadFilters({ agent: 'all' }).agent, undefined);
    assert.equal(parseLeadFilters({ agent: '' }).agent, undefined);
  });

  it('rejects anything else, and ignores objects (query-string injection)', () => {
    assert.throws(() => parseLeadFilters({ agent: 'abc' }), /Invalid id/);
    assert.equal(parseLeadFilters({ agent: { $ne: '' } }).agent, undefined);
    assert.equal(parseLeadFilters({ agent: ['a', 'b'] }).agent, undefined);
  });
});
