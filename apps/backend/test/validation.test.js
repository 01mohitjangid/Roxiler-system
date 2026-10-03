import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validate } from '@roxiler/shared';

test('a field checked with the password rule is not trimmed, like "password" itself', () => {
  for (const pw of ['Abc!     ', 'Abcdefg!         ', ' Valid@123 ']) {
    const direct = validate({ password: pw }, ['password']).errors;
    const mapped = validate({ new_password: pw }, ['new_password'], { new_password: 'password' }).errors;
    assert.equal(Boolean(direct), Boolean(mapped), JSON.stringify(pw));
  }
});
